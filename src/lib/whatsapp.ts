import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';

export type WAConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED';

export interface WAState {
  status: WAConnectionStatus;
  qrCodeUrl: string | null;
  phoneNumber: string | null;
  userName: string | null;
  error: string | null;
}

class WhatsAppManager extends EventEmitter {
  private socket: WASocket | null = null;
  private state: WAState = {
    status: 'DISCONNECTED',
    qrCodeUrl: null,
    phoneNumber: null,
    userName: null,
    error: null,
  };
  private authDir: string;
  private isInitializing: boolean = false;

  constructor() {
    super();
    this.authDir = path.join(process.cwd(), 'whatsapp-auth');
  }

  public getState(): WAState {
    return { ...this.state };
  }

  public async init(): Promise<WAState> {
    if (this.socket && this.state.status === 'CONNECTED') {
      return this.getState();
    }

    if (this.isInitializing) {
      return this.getState();
    }

    this.isInitializing = true;
    this.updateState({ status: 'CONNECTING', error: null });

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      const logger = pino({ level: 'silent' });

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ['WhatsApp Mass Marketer', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 15_000,
        emitOwnEvents: false,
        retryRequestDelayMs: 250,
      });

      this.socket = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrCodeUrl = await QRCode.toDataURL(qr, { margin: 2, width: 320 });
            this.updateState({
              status: 'SCAN_QR',
              qrCodeUrl,
              error: null,
            });
          } catch (err: any) {
            console.error('Failed to generate QR Data URL:', err);
          }
        }

        if (connection === 'open') {
          const userJid = sock.user?.id || '';
          const phoneNumber = userJid.split(':')[0].split('@')[0] || sock.user?.id || 'Connected';
          const userName = sock.user?.name || sock.user?.notify || 'WhatsApp User';

          this.updateState({
            status: 'CONNECTED',
            qrCodeUrl: null,
            phoneNumber,
            userName,
            error: null,
          });
          this.isInitializing = false;
        }

        if (connection === 'close') {
          this.isInitializing = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`WhatsApp connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            this.updateState({
              status: 'CONNECTING',
              error: 'Reconnecting to WhatsApp...',
            });
            setTimeout(() => this.init(), 3000);
          } else {
            this.updateState({
              status: 'DISCONNECTED',
              qrCodeUrl: null,
              phoneNumber: null,
              userName: null,
              error: 'Session logged out. Please reconnect.',
            });
            this.cleanupAuth();
          }
        }
      });

      this.isInitializing = false;
      return this.getState();
    } catch (err: any) {
      this.isInitializing = false;
      this.updateState({
        status: 'DISCONNECTED',
        error: err.message || 'Failed to initialize WhatsApp',
      });
      return this.getState();
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.socket) {
        await this.socket.logout().catch(() => {});
        this.socket.end(undefined);
        this.socket = null;
      }
    } catch (e) {
      console.error('Error during logout:', e);
    }

    this.cleanupAuth();
    this.updateState({
      status: 'DISCONNECTED',
      qrCodeUrl: null,
      phoneNumber: null,
      userName: null,
      error: null,
    });
  }

  private cleanupAuth() {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('Could not clean auth dir immediately:', e);
    }
  }

  private updateState(partial: Partial<WAState>) {
    this.state = { ...this.state, ...partial };
    this.emit('state:change', this.getState());
  }

  /**
   * Check if a single number exists on WhatsApp.
   * phone format: 91XXXXXXXXXX
   */
  public async checkNumber(phone: string): Promise<{ exists: boolean; jid: string }> {
    if (!this.socket || this.state.status !== 'CONNECTED') {
      throw new Error('WhatsApp is not connected. Please scan QR code first.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    try {
      const results = await this.socket.onWhatsApp(jid);
      if (results && results.length > 0 && results[0].exists) {
        return { exists: true, jid: results[0].jid };
      }
      return { exists: false, jid };
    } catch (err) {
      console.error(`Error checking number ${phone}:`, err);
      return { exists: false, jid };
    }
  }

  /**
   * Check batch of numbers on WhatsApp.
   */
  public async checkNumbersBatch(
    phones: string[],
    onProgress?: (checked: number, total: number, result: { phone: string; exists: boolean }) => void
  ): Promise<Record<string, boolean>> {
    if (!this.socket || this.state.status !== 'CONNECTED') {
      throw new Error('WhatsApp is not connected. Please scan QR code first.');
    }

    const resultsMap: Record<string, boolean> = {};

    for (let i = 0; i < phones.length; i++) {
      const phone = phones[i];
      const res = await this.checkNumber(phone);
      resultsMap[phone] = res.exists;

      if (onProgress) {
        onProgress(i + 1, phones.length, { phone, exists: res.exists });
      }

      // Small jitter between checks to avoid rate limits
      if (i < phones.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return resultsMap;
  }

  /**
   * Send a message (text and/or media) to a recipient.
   */
  public async sendToNumber(
    phone: string,
    messageText: string,
    media?: {
      buffer: Buffer;
      mimetype: string;
      fileName?: string;
      type: 'image' | 'video' | 'audio' | 'document';
    }
  ): Promise<boolean> {
    if (!this.socket || this.state.status !== 'CONNECTED') {
      throw new Error('WhatsApp is not connected.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    if (media) {
      if (media.type === 'image') {
        await this.socket.sendMessage(jid, {
          image: media.buffer,
          caption: messageText || undefined,
          mimetype: media.mimetype,
        });
      } else if (media.type === 'video') {
        await this.socket.sendMessage(jid, {
          video: media.buffer,
          caption: messageText || undefined,
          mimetype: media.mimetype,
        });
      } else if (media.type === 'audio') {
        await this.socket.sendMessage(jid, {
          audio: media.buffer,
          mimetype: media.mimetype,
        });
        if (messageText) {
          await this.socket.sendMessage(jid, { text: messageText });
        }
      } else {
        // Document (PDF, docx, etc.)
        await this.socket.sendMessage(jid, {
          document: media.buffer,
          mimetype: media.mimetype,
          fileName: media.fileName || 'file',
          caption: messageText || undefined,
        });
      }
    } else {
      // Pure text
      await this.socket.sendMessage(jid, { text: messageText });
    }

    return true;
  }
}

// Global singleton to survive Next.js module reloads
const globalForWA = globalThis as unknown as {
  waManager: WhatsAppManager | undefined;
};

export const waManager = globalForWA.waManager ?? new WhatsAppManager();

if (process.env.NODE_ENV !== 'production') {
  globalForWA.waManager = waManager;
}
