import { NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await waManager.disconnect();
    return NextResponse.json({ success: true, message: 'Disconnected from WhatsApp' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
