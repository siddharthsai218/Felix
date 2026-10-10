// frontend/src/app/lib/event-bus.ts
// Producer: Part 1 [Live Session & Interface]
// Consumer: Part 2 [Behavioral Telemetry]

export interface SttWordTimestamp {
  text: string;
  start: number;      // ms relative to response start
  end: number;        // ms relative to response start
  confidence: number; // 0-1
}

export interface AudioHandoff {
  type: 'audio-handoff';
  sessionId: string;
  responseIndex: number;
  audioBlob: Blob;
  format: 'audio/wav' | 'audio/webm;codecs=opus';
  sampleRate: number;
  durationMs: number;
  sttTimestamps: SttWordTimestamp[];
}

export interface VideoFrameHandoff {
  type: 'video-frame';
  sessionId: string;
  responseIndex: number;
  timestamp: number;
  imageData: ImageData;
  width: number;
  height: number;
}

export interface VideoHandoff {
  type: 'video-handoff';
  sessionId: string;
  responseIndex: number;
  videoBlob: Blob;
  format: 'video/webm;codecs=vp8';
  durationMs: number;
}

type EventMap = {
  'capture:audio-handoff': AudioHandoff;
  'capture:video-frame': VideoFrameHandoff;
  'capture:video-handoff': VideoHandoff;
};

type EventListener<T> = (data: T) => void;

class TypedEventBus {
  private listeners: Map<string, Set<EventListener<any>>> = new Map();

  on<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off<K extends keyof EventMap>(event: K, listener: EventListener<EventMap[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }

    // Also dispatch to window for external listeners if running in browser
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
  }
}

export const captureEventBus = new TypedEventBus();
