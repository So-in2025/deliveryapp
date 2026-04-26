
/**
 * Sound Service for handling application alerts
 */

class SoundService {
  private enabled: boolean = true;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize AudioContext on first user interaction to comply with browser policies
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('touchstart', initAudio);
      };
      window.addEventListener('click', initAudio);
      window.addEventListener('touchstart', initAudio);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async play(type: string) {
    if (type === 'NEW_ORDER') {
      await this.playNewOrder();
    } else {
      await this.playNotification();
    }
  }

  async playNotification() {
    if (!this.enabled || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.5); // A4

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  async playNewOrder() {
    if (!this.enabled || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Play a "ding-dong" sequence
    this.playTone(523.25, 0.2, 0); // C5
    this.playTone(659.25, 0.4, 0.2); // E5
  }

  private playTone(freq: number, duration: number, startTime: number) {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + startTime);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime + startTime);
    oscillator.stop(this.audioContext.currentTime + startTime + duration);
  }
}

export const soundService = new SoundService();
