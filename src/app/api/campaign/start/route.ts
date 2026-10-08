import { NextRequest, NextResponse } from 'next/server';
import { campaignManager, CampaignRecipient, CampaignMedia, CampaignSettings } from '@/lib/campaign';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipients,
      messageTemplate,
      media,
      settings,
    }: {
      recipients: CampaignRecipient[];
      messageTemplate: string;
      media?: CampaignMedia | null;
      settings?: Partial<CampaignSettings>;
    } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided for the campaign' },
        { status: 400 }
      );
    }

    if (!messageTemplate && !media) {
      return NextResponse.json(
        { error: 'Please provide either a message or media attachment' },
        { status: 400 }
      );
    }

    const state = await campaignManager.start(
      recipients,
      messageTemplate || '',
      media || null,
      settings
    );

    return NextResponse.json({
      success: true,
      campaign: state,
    });
  } catch (error: any) {
    console.error('Error starting campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start campaign' },
      { status: 500 }
    );
  }
}
