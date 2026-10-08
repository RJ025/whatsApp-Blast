# WhatsBlast - WhatsApp Bulk Marketing Platform (India Edition 🇮🇳)

A modern, fast, and secure Next.js & TypeScript web application designed to extract Indian phone numbers from Excel/CSV/PDF files, check their active WhatsApp presence, compose personalized messages with photo/video attachments, and safely dispatch campaigns.

---

## 🌟 Key Features

1. **WhatsApp Web QR Code Linking (Zero Meta API Fees)**
   - Powered by `@whiskeysockets/baileys` Multi-Device WebSocket protocol.
   - Scan QR code directly using your personal or business WhatsApp mobile app.
   - Session persistence: stay connected across app refreshes.

2. **Smart Indian Phone Number Auto-Detection**
   - Supports **Excel (.xlsx, .xls)**, **CSV (.csv)**, and **PDF (.pdf)** documents.
   - Auto-scans all sheets, rows, columns, and free-form paragraphs.
   - Normalizes any Indian number format (`+91 98765 43210`, `09876543210`, `919876543210`, `9876543210`) into valid canonical WhatsApp IDs (`91XXXXXXXXXX`).
   - Auto-extracts contact names if present and deduplicates repeat numbers.

3. **Live WhatsApp Presence Verification**
   - Check which extracted phone numbers are registered on WhatsApp before sending.
   - Filter and auto-select only registered WhatsApp numbers with 1-click.

4. **Rich Message & Media Composer**
   - Dynamic tag personalization: `{name}`, `{phone}`, `{number}`.
   - Quick emoji drawer and formatting hints.
   - Attach media: **Photos (JPG, PNG)**, **Videos (MP4)**, **Documents (PDF, Word)**, and **Audio**.
   - Live **WhatsApp Chat Preview** modal simulating the recipient's phone view.

5. **Anti-Ban Safety & Campaign Controls**
   - Configurable randomized delays (e.g. 5–12 seconds per message) to prevent spam flags.
   - Batch cooling pauses (e.g. 25-second pause every 20 messages).
   - Live progress monitor with Pause, Resume, and Abort controls.
   - Export delivery report as CSV (`Timestamp, Phone, Name, Status, Error`).

---

## 🚀 Getting Started

### 1. Start the Dev Server
The app runs on port `3000`:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📋 5-Step Campaign Workflow

1. **Step 1: Link WhatsApp**: Click "Generate QR Code" and scan it from WhatsApp on your phone (**Settings / Menu > Linked Devices > Link a Device**).
2. **Step 2: Upload File or Load Sample**: Drop any Excel or PDF file, or click **"Load Sample Data"** to test immediately.
3. **Step 3: Verify Numbers**: Click **"Check WhatsApp Presence"** to verify active WhatsApp accounts, then filter or select verified numbers.
4. **Step 4: Compose Message & Media**: Write your broadcast text, use `{name}` personalization, and optionally attach photos or videos. Click **"Preview Chat"** to verify the look.
5. **Step 5: Launch Campaign**: Set delay interval and click **"Start WhatsApp Blast"** to watch live delivery progress.
