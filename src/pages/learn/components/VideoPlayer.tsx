import { useState, useEffect, useRef } from "react";

// Quick helper to fix your formatRemainingTime reference
const formatRemainingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function VideoPlayer({ veedUrl, title, completed = false, onComplete }: any) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<any>(null); // Kept to programmatically trigger play/pause for Vimeo

  // 1. Dynamic Provider Evaluation & Sanitization Engine
  const isYouTube = veedUrl?.includes('youtube.com') || veedUrl?.includes('youtu.be');
  const isVimeo = veedUrl?.includes('vimeo.com');

  const embedUrl = (() => {
    if (!veedUrl) return "";
    try {
      if (isYouTube) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = veedUrl.match(regExp);
        const ytId = match && match[2].length === 11 ? match[2] : null;

        // UNCHANGED: Your exact original YouTube URL generation string
        return ytId ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&controls=0&disablekb=1` : "";
      }
      if (isVimeo) {
        const match = veedUrl.match(/(?:vimeo\.com\/|video\/)(\d+)/);
        const vimeoId = match && match[1] ? match[1] : null;

        // UPDATED: Added controls=0 to hide the Vimeo control panel
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&api=1&controls=0` : "";
      }
    } catch (e) {
      console.error("Error formatting URL:", e);
    }
    return veedUrl;
  })();

  // Click handler for our custom overlay button
  const handleOverlayPlayToggle = () => {
    // Only intercept for Vimeo since controls=0 breaks its native interface
    if (isVimeo && vimeoPlayerRef.current) {
      if (isPlaying) {
        vimeoPlayerRef.current.pause();
      } else {
        vimeoPlayerRef.current.play();
      }
    }
  };

  // Reset internal lock mechanisms cleanly if a retry is forced
  useEffect(() => {
    if (!completed) {
      setIsTimeUp(false);
      setHasStarted(false);
      setIsPlaying(false);
    }
  }, [completed]);

  // 2. Countdown Engine Loop
  useEffect(() => {
    if (!hasStarted || !isPlaying || completed || isTimeUp) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isPlaying, completed, isTimeUp]);

  // 3. Native SDK Event Binding Bridge
  useEffect(() => {
    if (!iframeRef.current || !embedUrl || completed || isTimeUp) return;

    let vimeoPlayer: any = null;

    // Platform Track A: Native Vimeo Event Interceptor
    if (isVimeo) {
      // @ts-ignore
      if (window.Vimeo && window.Vimeo.Player) {
        // @ts-ignore
        vimeoPlayer = new window.Vimeo.Player(iframeRef.current);
        vimeoPlayerRef.current = vimeoPlayer;

        vimeoPlayer.getDuration().then((dur: number) => {
          setTimeLeft(Math.floor(dur));
        });

        vimeoPlayer.on('play', () => {
          setHasStarted(true);
          setIsPlaying(true);
        });
        vimeoPlayer.on('pause', () => {
          setIsPlaying(false);
        });
        vimeoPlayer.on('ended', () => {
          setIsPlaying(false);
          setIsTimeUp(true);
          setTimeLeft(0);
        });
      }
    }

    // Platform Track B: Native YouTube Event Interceptor (UNCHANGED)
    if (isYouTube) {
      // @ts-ignore
      if (window.YT && window.YT.Player) {
        // @ts-ignore
        ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (event: any) => {
              setTimeLeft(Math.floor(event.target.getDuration()));
            },
            onStateChange: (event: any) => {
              // YouTube Player States: 1 = Playing, 2 = Paused, 0 = Ended
              if (event.data === 1) {
                setHasStarted(true);
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                setIsTimeUp(true);
                setTimeLeft(0);
              }
            }
          }
        });
      }
    }

    return () => {
      if (vimeoPlayer) {
        vimeoPlayer.off('play');
        vimeoPlayer.off('pause');
        vimeoPlayer.off('ended');
      }
    };
  }, [embedUrl, completed, isTimeUp, isVimeo, isYouTube]);

  if (!embedUrl) {
    return <div className="text-center text-gray-500 py-10">Invalid Video Address Parameter</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div
        className="relative w-full rounded-3xl overflow-hidden bg-background-950 shadow-xl group/player"
        style={{ aspectRatio: "16 / 9", minHeight: "75vh" }}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          // YouTube keeps its normal mouse behaviors, Vimeo uses programmatic clicks
          className={`absolute inset-0 w-full h-full ${isVimeo ? "pointer-events-none" : ""}`}
        />

        {/* ─── VIMEO-ONLY CUSTOM CENTER PLAY/PAUSE OVERLAY ─── */}
        {isVimeo && !isTimeUp && !completed && (
          <div
            onClick={handleOverlayPlayToggle}
            className={`absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer transition-opacity duration-300
              ${isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
          >
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/90 text-black shadow-2xl transform transition-transform duration-200 hover:scale-110 active:scale-95">
              <i className={`text-4xl ${isPlaying ? "ri-pause-fill" : "ri-play-fill ml-1"}`}></i>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center">
        {completed ? (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
            <i className="ri-checkbox-circle-fill text-lg"></i>
            <span>Video completed &mdash; Quiz locked</span>
          </div>
        ) : (
          <button
            onClick={onComplete}
            disabled={!isTimeUp}
            className={`group flex items-center gap-3 px-8 py-4 font-semibold rounded-2xl text-base transition-all shadow-lg whitespace-nowrap
              ${isTimeUp
                ? "bg-primary-500 hover:bg-primary-600 text-background-50 shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none select-none"
              }`}
          >
            <i className={isTimeUp
              ? "ri-check-double-line text-xl"
              : isPlaying
                ? "ri-time-line text-xl animate-spin text-primary-500"
                : "ri-pause-circle-line text-xl text-yellow-500 animate-pulse"
            }></i>
            <span>
              {isTimeUp
                ? "I've Finished Watching — Unlock Quiz"
                : !hasStarted
                  ? "Click Play on the video to start tracking"
                  : isPlaying
                    ? `Watching video... (${formatRemainingTime(timeLeft)})`
                    : `Video paused. Resume playback to continue watching and unlock the quiz (${formatRemainingTime(timeLeft)} remaining)`
              }
            </span>
            {isTimeUp && (
              <i className="ri-arrow-right-line text-xl group-hover:translate-x-1 transition-transform"></i>
            )}
          </button>
        )}
      </div>
    </div>
  );
}