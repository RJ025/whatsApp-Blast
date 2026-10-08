import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

export interface ExtractedContact {
  id: string;
  raw: string;
  clean: string;          // 91XXXXXXXXXX (canonical for WhatsApp JID)
  formatted: string;      // +91 XXXXX XXXXX
  name?: string;
  source: string;
  existsOnWhatsApp?: boolean | null; // null = pending check, true = on wa, false = not on wa
  verifiedJid?: string;
}

export interface ExtractionResult {
  contacts: ExtractedContact[];
  totalFound: number;
  uniqueCount: number;
  duplicateCount: number;
  fileName: string;
}

/**
 * Normalizes any text to an Indian phone number if valid.
 * Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9.
 * Returns canonical 91XXXXXXXXXX or null if not an Indian mobile number.
 */
export function normalizeIndianNumber(input: string | number): { clean: string; formatted: string } | null {
  if (input === null || input === undefined) return null;

  let str = String(input).trim();

  // Handle excel float or scientific notation (e.g. 9876543210.0 or 9.87654321e9)
  if (!isNaN(Number(str)) && str.includes('.')) {
    const num = Number(str);
    str = Math.round(num).toString();
  }

  // Remove non-digit characters except leading plus
  const digitsOnly = str.replace(/\D/g, '');

  let tenDigitNumber = '';

  if (digitsOnly.length === 10) {
    // 9876543210
    tenDigitNumber = digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    // 09876543210
    tenDigitNumber = digitsOnly.substring(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    // 919876543210
    tenDigitNumber = digitsOnly.substring(2);
  } else if (digitsOnly.length > 12 && digitsOnly.startsWith('0091')) {
    // 00919876543210
    tenDigitNumber = digitsOnly.substring(4);
  } else {
    // Check if within the string there is an Indian 10-digit number
    const match = str.match(/(?:(?:\+?91|0)?[ -]?)?([6-9]\d{9})\b/);
    if (match && match[1]) {
      tenDigitNumber = match[1];
    }
  }

  // Validate Indian mobile starting digit (6, 7, 8, 9)
  if (tenDigitNumber.length === 10 && /^[6-9]\d{9}$/.test(tenDigitNumber)) {
    const clean = `91${tenDigitNumber}`;
    const formatted = `+91 ${tenDigitNumber.slice(0, 5)} ${tenDigitNumber.slice(5)}`;
    return { clean, formatted };
  }

  return null;
}

/**
 * Find all Indian phone numbers in a block of arbitrary text (e.g. PDF text).
 */
export function findIndianNumbersInText(text: string): { number: string; raw: string }[] {
  const results: { number: string; raw: string }[] = [];
  // Regex matches Indian numbers with optional country prefix and separators
  const regex = /(?:(?:\+?91|0)[\s-]?)?([6-9]\d{4}[\s-]?\d{5}|[6-9]\d{9})\b/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const candidate = match[1].replace(/\D/g, '');
    if (candidate.length === 10 && /^[6-9]\d{9}$/.test(candidate)) {
      results.push({ number: candidate, raw });
    }
  }
  return results;
}

/**
 * Extract phone numbers and contacts from an Excel (.xlsx, .xls) or CSV buffer.
 */
export async function extractFromExcel(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const rawContacts: { raw: string; clean: string; formatted: string; name?: string; source: string }[] = [];
  const seenNumbers = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON with headers
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (rows.length > 0) {
      // First try row-by-row scanning with header awareness
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        let foundName: string | undefined;

        // Look for name-like column
        for (const [key, val] of Object.entries(row)) {
          const lKey = key.toLowerCase();
          if (
            (lKey.includes('name') || lKey.includes('contact') || lKey.includes('customer') || lKey.includes('client')) &&
            typeof val === 'string' &&
            val.trim().length > 1 &&
            !/\d{5}/.test(val)
          ) {
            foundName = val.trim();
            break;
          }
        }

        // Auto-detect numbers across all columns of this row
        for (const [key, val] of Object.entries(row)) {
          if (!val) continue;
          const valStr = String(val).trim();

          // Check if single cell contains multiple numbers or text
          const inTextMatches = findIndianNumbersInText(valStr);
          if (inTextMatches.length > 0) {
            for (const m of inTextMatches) {
              const normalized = normalizeIndianNumber(m.number);
              if (normalized) {
                rawContacts.push({
                  raw: m.raw,
                  clean: normalized.clean,
                  formatted: normalized.formatted,
                  name: foundName,
                  source: `${sheetName} (Row ${rIdx + 2}, Col ${key})`,
                });
              }
            }
          } else {
            const normalized = normalizeIndianNumber(valStr);
            if (normalized) {
              rawContacts.push({
                raw: valStr,
                clean: normalized.clean,
                formatted: normalized.formatted,
                name: foundName,
                source: `${sheetName} (Row ${rIdx + 2}, Col ${key})`,
              });
            }
          }
        }
      }
    } else {
      // If sheet_to_json is empty, do a raw cell scan
      for (const cellAddress in sheet) {
        if (cellAddress.startsWith('!')) continue;
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          const normalized = normalizeIndianNumber(cell.v);
          if (normalized) {
            rawContacts.push({
              raw: String(cell.v),
              clean: normalized.clean,
              formatted: normalized.formatted,
              source: `${sheetName} (${cellAddress})`,
            });
          }
        }
      }
    }
  }

  // Deduplicate by clean number while preserving name if available
  const contacts: ExtractedContact[] = [];
  let duplicateCount = 0;

  for (let i = 0; i < rawContacts.length; i++) {
    const item = rawContacts[i];
    if (seenNumbers.has(item.clean)) {
      duplicateCount++;
      // If we found a name in a later occurrence, update the existing contact
      if (item.name) {
        const existing = contacts.find((c) => c.clean === item.clean);
        if (existing && !existing.name) {
          existing.name = item.name;
        }
      }
      continue;
    }

    seenNumbers.add(item.clean);
    contacts.push({
      id: `cnt_${Date.now()}_${i}`,
      raw: item.raw,
      clean: item.clean,
      formatted: item.formatted,
      name: item.name || '',
      source: item.source,
      existsOnWhatsApp: null,
    });
  }

  return {
    contacts,
    totalFound: rawContacts.length,
    uniqueCount: contacts.length,
    duplicateCount,
    fileName,
  };
}

/**
 * Extract phone numbers from a PDF buffer.
 */
export async function extractFromPdf(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  const data = await pdfParse(buffer);
  const text = data.text || '';

  const matched = findIndianNumbersInText(text);
  const rawContacts: { raw: string; clean: string; formatted: string; source: string }[] = [];
  const seenNumbers = new Set<string>();

  for (const m of matched) {
    const normalized = normalizeIndianNumber(m.number);
    if (normalized) {
      rawContacts.push({
        raw: m.raw,
        clean: normalized.clean,
        formatted: normalized.formatted,
        source: `PDF Page Text`,
      });
    }
  }

  const contacts: ExtractedContact[] = [];
  let duplicateCount = 0;

  for (let i = 0; i < rawContacts.length; i++) {
    const item = rawContacts[i];
    if (seenNumbers.has(item.clean)) {
      duplicateCount++;
      continue;
    }
    seenNumbers.add(item.clean);
    contacts.push({
      id: `cnt_${Date.now()}_${i}`,
      raw: item.raw,
      clean: item.clean,
      formatted: item.formatted,
      name: '',
      source: item.source,
      existsOnWhatsApp: null,
    });
  }

  return {
    contacts,
    totalFound: rawContacts.length,
    uniqueCount: contacts.length,
    duplicateCount,
    fileName,
  };
}
