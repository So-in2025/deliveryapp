/**
 * SoundService handles audio feedback for the application.
 * Uses public CDN URLs for common notification sounds.
 */

const SOUND_URLS = {
  NEW_ORDER: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // Ding
  ORDER_ACCEPTED: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', // Success chime
  NOTIFICATION: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // Soft pop
  ALERT: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3', // Alert
};

class SoundService {
  private static instance: SoundService;
  private audioMap: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  private constructor() {
    // Preload sounds
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.audioMap.set(key, audio);
    });
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  public play(soundKey: keyof typeof SOUND_URLS) {
    if (!this.enabled) return;
    
    const audio = this.audioMap.get(soundKey);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => console.warn('Sound playback failed:', err));
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled() {
    return this.enabled;
  }
}

export const soundService = SoundService.getInstance();
