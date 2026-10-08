import { NextRequest, NextResponse } from 'next/server';
import { campaignManager } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { action }: { action: 'pause' | 'resume' | 'stop' } = await req.json();

    let state;
    if (action === 'pause') {
      state = campaignManager.pause();
    } else if (action === 'resume') {
      state = campaignManager.resume();
    } else if (action === 'stop') {
      state = campaignManager.stop();
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: pause, resume, stop' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: state,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to control campaign' },
      { status: 500 }
    );
  }
}
