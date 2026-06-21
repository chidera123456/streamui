type MediaProgress = {
  id: string;
  duration?: number;
  currentTime?: number;
  lastUpdated: number;
  episodes: Record<string, {
    season: string;
    episode: string;
    currentTime: number;
    duration: number;
    lastUpdated: number;
  }>;
};

class ProgressTracker {
  private listeners: Set<(event: MessageEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleWindowMessage);
    }
  }

  private handleWindowMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object' && event.data.event) {
      // Forward to all local listeners
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error('Error in progressTracker listener:', err);
        }
      });

      // Automatically save progress to localStorage
      const { currentTime, duration, mediaId, season, episode } = event.data;
      if (mediaId && typeof currentTime === 'number') {
        this.saveProgress(
          String(mediaId),
          currentTime,
          typeof duration === 'number' ? duration : 0,
          season ? String(season) : undefined,
          episode ? String(episode) : undefined
        );
      }
    }
  };

  public addEventListener(listener: (event: MessageEvent) => void) {
    this.listeners.add(listener);
  }

  public removeEventListener(listener: (event: MessageEvent) => void) {
    this.listeners.delete(listener);
  }

  public saveProgress(mediaId: string, currentTime: number, duration: number, season?: string, episode?: string) {
    try {
      const data = this.getAllMediaData();
      const now = Date.now();

      if (!data[mediaId]) {
        data[mediaId] = {
          id: mediaId,
          episodes: {},
          lastUpdated: now
        };
      }

      const mediaEntry = data[mediaId];
      mediaEntry.lastUpdated = now;

      if (season && episode) {
        const epKey = `${season}x${episode}`;
        mediaEntry.episodes[epKey] = {
          season,
          episode,
          currentTime,
          duration,
          lastUpdated: now
        };
      } else {
        mediaEntry.currentTime = currentTime;
        mediaEntry.duration = duration;
      }

      localStorage.setItem('ts_progress_tracking', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save progress in tracker:', err);
    }
  }

  public getAllMediaData(): Record<string, MediaProgress> {
    try {
      const stored = localStorage.getItem('ts_progress_tracking');
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      console.error('Failed to read all progress:', err);
      return {};
    }
  }

  public getMediaData(mediaId: string): MediaProgress | null {
    const all = this.getAllMediaData();
    return all[mediaId] || null;
  }

  public getResumeTime(mediaId: string, season?: string, episode?: string): number {
    const mediaEntry = this.getMediaData(mediaId);
    if (!mediaEntry) return 0;

    if (season && episode) {
      const epKey = `${season}x${episode}`;
      const epData = mediaEntry.episodes?.[epKey];
      if (epData) {
        const { currentTime, duration } = epData;
        if (duration > 0 && currentTime / duration > 0.95) {
          return 0; // Completed, start from beginning
        }
        return currentTime || 0;
      }
      return 0;
    }

    const { currentTime, duration } = mediaEntry;
    if (currentTime && duration && duration > 0 && currentTime / duration > 0.95) {
      return 0; // Completed, start from beginning
    }
    return currentTime || 0;
  }
}

export const progressTracker = new ProgressTracker();
