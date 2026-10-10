# Capture Handoff Contract — `[1]` → `[2]`

> **Producer:** Part 1 (Live Session & Interface)  
> **Consumer:** Part 2 (Behavioral Telemetry)  
> **Transport:** In-browser message passing (postMessage or shared event bus)

## Overview

Part 1 owns all media device permissions (microphone + camera). Part 2 never directly accesses `getUserMedia()`. Instead, Part 1 streams raw media data to Part 2 via the mechanisms described below.

## Audio Handoff

### Per-Response Audio Blob

After each learner response ends (turn boundary), Part 1 emits:

```typescript
interface AudioHandoff {
  type: 'audio-handoff';
  sessionId: string;
  responseIndex: number;       // 0-based index of this response in the session
  audioBlob: Blob;             // WAV or WebM audio of the learner's response
  format: 'audio/wav' | 'audio/webm;codecs=opus';
  sampleRate: number;          // e.g. 16000 or 48000
  durationMs: number;          // duration in milliseconds
  sttTimestamps: SttWordTimestamp[];  // word-level timestamps from AssemblyAI
}

interface SttWordTimestamp {
  text: string;       // the word
  start: number;      // start time in ms relative to response start
  end: number;        // end time in ms
  confidence: number; // 0-1
}
```

### Delivery
- Emitted via a shared `EventBus` (custom event `'capture:audio-handoff'`)
- Part 2 listens and processes asynchronously — never blocks the live turn

## Video Handoff

### Video Frame Stream

During an active response, Part 1 provides video frames:

```typescript
interface VideoFrameHandoff {
  type: 'video-frame';
  sessionId: string;
  responseIndex: number;
  timestamp: number;           // ms relative to response start
  imageData: ImageData;        // raw RGBA pixel data from canvas
  width: number;
  height: number;
}
```

### Delivery
- Frames emitted at ~5 fps via `'capture:video-frame'` event
- Part 1 captures from the camera `<video>` element using `canvas.getContext('2d').drawImage()`
- Part 2 receives frames for MediaPipe / Py-feat processing

## Video Blob (Post-Response)

After each response, Part 1 also emits the complete recorded video:

```typescript
interface VideoHandoff {
  type: 'video-handoff';
  sessionId: string;
  responseIndex: number;
  videoBlob: Blob;
  format: 'video/webm;codecs=vp8';
  durationMs: number;
}
```

## Guarantees

- Part 1 always requests `{ audio: true, video: true }` permissions
- If camera permission is denied, Part 1 emits audio-only handoffs (no video events)
- All timestamps are relative to response start (not session start)
- Part 2 must handle missing video gracefully
- Part 2 NEVER calls `navigator.mediaDevices.getUserMedia()` directly

## Event Bus Reference

```typescript
// frontend/src/app/lib/event-bus.ts (Part 1 owns this file)
import { EventEmitter } from 'events';
export const captureEventBus = new EventEmitter();

// Part 1 emits:
captureEventBus.emit('capture:audio-handoff', audioHandoff);
captureEventBus.emit('capture:video-frame', videoFrame);
captureEventBus.emit('capture:video-handoff', videoHandoff);

// Part 2 listens:
captureEventBus.on('capture:audio-handoff', (data: AudioHandoff) => { ... });
captureEventBus.on('capture:video-frame', (data: VideoFrameHandoff) => { ... });
captureEventBus.on('capture:video-handoff', (data: VideoHandoff) => { ... });
```
