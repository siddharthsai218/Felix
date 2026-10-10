'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { TurnState } from '../lib/types';

interface AvatarProps {
  state: TurnState;
  isSpeaking: boolean;
  audioLevel?: number;
  captionText?: string;
  themeColor?: string;
  beyondPresenceAgentId?: string;
  beyondPresenceUrl?: string;
  sessionId?: string;
}

/**
 * Isolated, memoized iframe component that NEVER re-renders or updates its DOM node.
 * This ensures Beyond Presence WebRTC connection is never torn down or reloaded by parent state updates.
 */
const StableIframe = React.memo<{ url: string }>(({ url }) => {
  return (
    <iframe
      src={url}
      title="Beyond Presence AI Avatar"
      allow="camera; microphone; autoplay; display-capture; encrypted-media; fullscreen; speaker-selection; camera *; microphone *;"
      allowFullScreen
      className="w-full h-full border-none object-cover pointer-events-auto"
    />
  );
});
StableIframe.displayName = 'StableIframe';

export const Avatar: React.FC<AvatarProps> = React.memo(({
  state,
  isSpeaking,
  beyondPresenceAgentId,
  beyondPresenceUrl,
}) => {
  const [isJoined, setIsJoined] = useState(false);

  // Beyond Presence agent ID strictly configured via environment
  const agentId =
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID ||
    beyondPresenceAgentId ||
    'd6f2bbee-88e6-42b5-a5f9-8eeb837a7fbf';

  const customUrl =
    beyondPresenceUrl ||
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_URL ||
    '';

  // Completely stable URL with no mutating parameters so iframe never reloads
  const embedUrl = useMemo(() => {
    return customUrl || `https://bey.chat/${agentId}?transparent=1`;
  }, [agentId, customUrl]);

  // Listen to postMessage from bey.chat for lifecycle events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'CALL_STARTED' || event.data.type === 'AGENT_JOINED') {
          setIsJoined(true);
        } else if (event.data.type === 'CALL_ENDED') {
          setIsJoined(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);



  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-black rounded-2xl sm:rounded-3xl">
      {/* Beyond Presence Video Agent Iframe (Stable, Isolated & Unobstructed) */}
      <StableIframe url={embedUrl} />
    </div>
  );
});

Avatar.displayName = 'Avatar';
