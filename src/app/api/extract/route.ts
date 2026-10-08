import { NextRequest, NextResponse } from 'next/server';
import { extractFromExcel, extractFromPdf, ExtractionResult } from '@/lib/extractor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result: ExtractionResult;

    if (
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv')
    ) {
      result = await extractFromExcel(buffer, fileName);
    } else if (lowerName.endsWith('.pdf')) {
      result = await extractFromPdf(buffer, fileName);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('File extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse file' },
      { status: 500 }
    );
  }
}
