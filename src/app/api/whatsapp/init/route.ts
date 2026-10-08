import { NextResponse } from 'next/server';
import { waManager } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const state = await waManager.init();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initialize WhatsApp' },
      { status: 500 }
    );
  }
}
