/**
 * Utility for playing notification sounds
 */

// Reliable notification sound
const NOTIFICATION_SOUND_URL = 'https://notifications-sounds.com/storage/sounds/pizzicato.mp3';

class AudioService {
    private audio: HTMLAudioElement | null = null;
    private isInitialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.init();
        }
    }

    private init() {
        try {
            this.audio = new Audio(NOTIFICATION_SOUND_URL);
            this.audio.load();
            this.isInitialized = true;
            console.log('[AudioService] Initialized with URL:', NOTIFICATION_SOUND_URL);
        } catch (error) {
            console.error('[AudioService] Failed to initialize:', error);
        }
    }

    /**
     * Play the notification sound
     */
    async playNotification() {
        if (!this.audio) {
            this.init();
        }
        if (!this.audio) return;

        try {
            console.log('[AudioService] Attempting to play sound...');
            // Reset to start if already playing
            this.audio.currentTime = 0;
            const playPromise = this.audio.play();

            if (playPromise !== undefined) {
                await playPromise;
                console.log('[AudioService] Sound played successfully');
            }
        } catch (error) {
            // Browser might block audio if no user interaction has occurred
            console.warn('[AudioService] Playback blocked or failed:', error);
        }
    }
}

export const audioService = new AudioService();
