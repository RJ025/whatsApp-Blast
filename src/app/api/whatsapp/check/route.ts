import { NextRequest, NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const waState = waManager.getState();
    if (waState.status !== 'CONNECTED') {
      return NextResponse.json(
        { error: 'WhatsApp is not connected. Please scan QR code first.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { phones } = body;

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { error: 'No phone numbers provided in request' },
        { status: 400 }
      );
    }

    // Check numbers in batch
    const results = await waManager.checkNumbersBatch(phones);

    return NextResponse.json({
      success: true,
      totalChecked: phones.length,
      results,
    });
  } catch (error: any) {
    console.error('Error checking numbers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check numbers on WhatsApp' },
      { status: 500 }
    );
  }
}
