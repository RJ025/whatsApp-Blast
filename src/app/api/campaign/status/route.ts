import { NextResponse } from 'next/server';
import { campaignManager } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = campaignManager.getState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get campaign status' },
      { status: 500 }
    );
  }
}
