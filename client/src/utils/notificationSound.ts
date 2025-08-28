// Notification sound utilities
export class NotificationSound {
  private static messageAudio: HTMLAudioElement | null = null;
  private static callingAudio: HTMLAudioElement | null = null;

  // Initialize audio elements
  static initialize() {
    try {
      this.messageAudio = new Audio('/notification_message.mp4');
      this.callingAudio = new Audio('/notification_calling.mp4');
      
      // Set volume
      this.messageAudio.volume = 0.7;
      this.callingAudio.volume = 0.8;
      
      // Preload
      this.messageAudio.preload = 'auto';
      this.callingAudio.preload = 'auto';
    } catch (error) {
      console.warn('Failed to initialize notification sounds:', error);
    }
  }

  // Play message notification sound
  static playMessageSound() {
    try {
      if (this.messageAudio) {
        this.messageAudio.currentTime = 0; // Reset to start
        this.messageAudio.play().catch(err => {
          console.warn('Failed to play message sound:', err);
        });
      }
    } catch (error) {
      console.warn('Error playing message sound:', error);
    }
  }

  // Play calling notification sound
  static playCallingSound() {
    try {
      if (this.callingAudio) {
        this.callingAudio.currentTime = 0; // Reset to start
        this.callingAudio.loop = true; // Loop for incoming calls
        this.callingAudio.play().catch(err => {
          console.warn('Failed to play calling sound:', err);
        });
      }
    } catch (error) {
      console.warn('Error playing calling sound:', error);
    }
  }

  // Stop calling sound
  static stopCallingSound() {
    try {
      if (this.callingAudio) {
        this.callingAudio.pause();
        this.callingAudio.currentTime = 0;
        this.callingAudio.loop = false;
      }
    } catch (error) {
      console.warn('Error stopping calling sound:', error);
    }
  }

  // Check if sounds are supported
  static isSupported(): boolean {
    return typeof Audio !== 'undefined';
  }

  // Set volume for sounds
  static setVolume(messageVolume: number, callingVolume: number) {
    try {
      if (this.messageAudio) {
        this.messageAudio.volume = Math.max(0, Math.min(1, messageVolume));
      }
      if (this.callingAudio) {
        this.callingAudio.volume = Math.max(0, Math.min(1, callingVolume));
      }
    } catch (error) {
      console.warn('Error setting volume:', error);
    }
  }
}
