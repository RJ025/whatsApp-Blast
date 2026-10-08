import { waManager } from './whatsapp';
import EventEmitter from 'events';

export interface CampaignLog {
  id: string;
  phone: string;
  name?: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  time: string;
  error?: string;
}

export interface CampaignRecipient {
  phone: string;
  name?: string;
}

export interface CampaignMedia {
  base64: string;
  mimetype: string;
  fileName?: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

export interface CampaignSettings {
  minDelaySeconds: number;
  maxDelaySeconds: number;
  batchSize: number;
  batchPauseSeconds: number;
}

export interface CampaignState {
  id: string | null;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed';
  total: number;
  sent: number;
  failed: number;
  currentIndex: number;
  currentRecipient: string | null;
  progressPercent: number;
  startTime: string | null;
  endTime: string | null;
  logs: CampaignLog[];
  errorMessage: string | null;
}

class CampaignManager extends EventEmitter {
  private state: CampaignState = {
    id: null,
    status: 'idle',
    total: 0,
    sent: 0,
    failed: 0,
    currentIndex: 0,
    currentRecipient: null,
    progressPercent: 0,
    startTime: null,
    endTime: null,
    logs: [],
    errorMessage: null,
  };

  private recipients: CampaignRecipient[] = [];
  private messageTemplate: string = '';
  private media: CampaignMedia | null = null;
  private settings: CampaignSettings = {
    minDelaySeconds: 5,
    maxDelaySeconds: 10,
    batchSize: 20,
    batchPauseSeconds: 25,
  };

  private shouldStop: boolean = false;
  private isPaused: boolean = false;

  public getState(): CampaignState {
    return { ...this.state };
  }

  public async start(
    recipients: CampaignRecipient[],
    messageTemplate: string,
    media: CampaignMedia | null,
    settings?: Partial<CampaignSettings>
  ): Promise<CampaignState> {
    if (this.state.status === 'running') {
      throw new Error('A campaign is already running.');
    }

    const waState = waManager.getState();
    if (waState.status !== 'CONNECTED') {
      throw new Error('WhatsApp is not connected. Please scan QR code first.');
    }

    this.recipients = recipients;
    this.messageTemplate = messageTemplate;
    this.media = media;
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    this.shouldStop = false;
    this.isPaused = false;

    this.state = {
      id: `camp_${Date.now()}`,
      status: 'running',
      total: recipients.length,
      sent: 0,
      failed: 0,
      currentIndex: 0,
      currentRecipient: null,
      progressPercent: 0,
      startTime: new Date().toLocaleTimeString(),
      endTime: null,
      logs: [],
      errorMessage: null,
    };

    this.emitChange();

    // Start background processing without blocking API route
    this.processQueue().catch((err) => {
      console.error('Campaign process error:', err);
      this.state.status = 'stopped';
      this.state.errorMessage = err.message || 'Campaign execution failed';
      this.emitChange();
    });

    return this.getState();
  }

  public pause(): CampaignState {
    if (this.state.status === 'running') {
      this.isPaused = true;
      this.state.status = 'paused';
      this.emitChange();
    }
    return this.getState();
  }

  public resume(): CampaignState {
    if (this.state.status === 'paused') {
      this.isPaused = false;
      this.state.status = 'running';
      this.emitChange();
    }
    return this.getState();
  }

  public stop(): CampaignState {
    this.shouldStop = true;
    this.isPaused = false;
    this.state.status = 'stopped';
    this.state.endTime = new Date().toLocaleTimeString();
    this.emitChange();
    return this.getState();
  }

  private async processQueue() {
    let mediaBuffer: Buffer | null = null;
    if (this.media) {
      mediaBuffer = Buffer.from(this.media.base64, 'base64');
    }

    for (let i = 0; i < this.recipients.length; i++) {
      if (this.shouldStop) {
        break;
      }

      // Handle pause loop
      while (this.isPaused && !this.shouldStop) {
        await new Promise((res) => setTimeout(res, 1000));
      }

      if (this.shouldStop) {
        break;
      }

      const item = this.recipients[i];
      this.state.currentIndex = i + 1;
      this.state.currentRecipient = item.phone;
      this.state.progressPercent = Math.round(((i + 1) / this.state.total) * 100);
      this.emitChange();

      // Render personalized message
      const personalizedMessage = this.renderMessage(this.messageTemplate, item);

      try {
        const mediaPayload = mediaBuffer && this.media
          ? {
              buffer: mediaBuffer,
              mimetype: this.media.mimetype,
              fileName: this.media.fileName,
              type: this.media.type,
            }
          : undefined;

        await waManager.sendToNumber(item.phone, personalizedMessage, mediaPayload);

        this.state.sent++;
        this.state.logs.unshift({
          id: `log_${Date.now()}_${i}`,
          phone: item.phone,
          name: item.name,
          status: 'SENT',
          time: new Date().toLocaleTimeString(),
        });
      } catch (err: any) {
        this.state.failed++;
        this.state.logs.unshift({
          id: `log_${Date.now()}_${i}`,
          phone: item.phone,
          name: item.name,
          status: 'FAILED',
          time: new Date().toLocaleTimeString(),
          error: err.message || 'Send error',
        });
      }

      this.emitChange();

      // Delay before next message (if not the last one)
      if (i < this.recipients.length - 1 && !this.shouldStop) {
        // Random anti-ban delay
        const min = Math.max(2, this.settings.minDelaySeconds);
        const max = Math.max(min, this.settings.maxDelaySeconds);
        const delaySec = Math.floor(Math.random() * (max - min + 1) + min);

        // Check batch interval pause
        if ((i + 1) % this.settings.batchSize === 0) {
          const pauseSec = this.settings.batchPauseSeconds;
          console.log(`Batch limit reached (${i + 1}). Pausing for ${pauseSec}s...`);
          await this.sleep(pauseSec * 1000);
        } else {
          await this.sleep(delaySec * 1000);
        }
      }
    }

    if (!this.shouldStop) {
      this.state.status = 'completed';
    }
    this.state.currentRecipient = null;
    this.state.endTime = new Date().toLocaleTimeString();
    this.emitChange();
  }

  private renderMessage(template: string, item: CampaignRecipient): string {
    let msg = template;
    msg = msg.replace(/\{name\}/gi, item.name || '');
    msg = msg.replace(/\{phone\}/gi, item.phone);
    msg = msg.replace(/\{number\}/gi, item.phone.slice(-10));
    return msg;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }

  private emitChange() {
    this.emit('change', this.getState());
  }
}

// Global singleton for campaign manager
const globalForCampaign = globalThis as unknown as {
  campaignManager: CampaignManager | undefined;
};

export const campaignManager = globalForCampaign.campaignManager ?? new CampaignManager();

if (process.env.NODE_ENV !== 'production') {
  globalForCampaign.campaignManager = campaignManager;
}
