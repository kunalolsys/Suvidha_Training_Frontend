import { useState, useEffect, useRef } from "react";
import Player from "@vimeo/player";
import { api } from "@/api/api";
import { API } from "@/api/endpoints";

const formatRemainingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function VideoPlayer({
  videoUrl,
  vimeoId,
  title,
  completed = false,
  onComplete
}: any) {
  // General Player States
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Vimeo States
  const [vimeoVideo, setVimeoVideo] = useState<any>(null);
  const [vimeoLoading, setVimeoLoading] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const playerRef = useRef<Player | null>(null);
  const maxWatchedRef = useRef<number>(0);

  // Extract raw numeric Vimeo ID
  const activeVimeoId = vimeoId?.toString().trim() || (() => {
    if (!videoUrl) return null;
    const match = videoUrl.match(/(?:vimeo\.com\/|video\/)(\d+)/);
    return match && match[1] ? match[1] : null;
  })();

  const isYouTube = !activeVimeoId && (videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be'));
  const isVimeo = Boolean(activeVimeoId) || videoUrl?.includes('vimeo.com');

  const progressKey = activeVimeoId ? `vimeo-progress-${activeVimeoId}` : null;

  // =========================================================================
  // 1. FETCH VIMEO METADATA VIA API
  // =========================================================================
  useEffect(() => {
    if (!isVimeo || !activeVimeoId) return;

    let mounted = true;

    const fetchVimeoVideo = async () => {
      try {
        setVimeoLoading(true);
        const response: any = await api.get(`${API.VIMEO}/${activeVimeoId}`);

        if (!mounted) return;

        if (response?.video) {
          setVimeoVideo(response.video);
        }
      } catch (err) {
        console.error("Fetch Vimeo API error:", err);
      } finally {
        if (mounted) setVimeoLoading(false);
      }
    };

    fetchVimeoVideo();

    return () => {
      mounted = false;
    };
  }, [isVimeo, activeVimeoId]);

  // Embed URL Generator
  const embedUrl = (() => {
    if (isVimeo) {
      const baseUrl = vimeoVideo?.player_embed_url || (activeVimeoId ? `https://player.vimeo.com/video/${activeVimeoId}` : "");
      if (!baseUrl) return "";
      return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}controls=0&dnt=1&transparent=0`;
    }

    if (!videoUrl) return "";

    try {
      if (isYouTube) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = videoUrl.match(regExp);
        const ytId = match && match[2].length === 11 ? match[2] : null;

        return ytId ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&controls=0&disablekb=1` : "";
      }
    } catch (e) {
      console.error("Error formatting URL:", e);
    }
    return videoUrl;
  })();

  // =========================================================================
  // 2. RETAKE QUIZ / RE-PLAY RESET (Preserves LocalStorage)
  // =========================================================================
  useEffect(() => {
    if (!completed) {
      setIsTimeUp(false);
      setHasStarted(false);
      setIsPlaying(false);
    }
  }, [completed]);

  // =========================================================================
  // 3. COUNTDOWN LOOP FOR NON-VIMEO (YouTube) ONLY
  // =========================================================================
  useEffect(() => {
    // Skip manual interval for Vimeo to prevent double decrement timing bugs
    if (isVimeo) return;
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
  }, [hasStarted, isPlaying, completed, isTimeUp, isVimeo]);

  // =========================================================================
  // 4. INITIALIZE VIMEO PLAYER & RESTORE PROGRESS
  // =========================================================================
  useEffect(() => {
    if (!isVimeo || !iframeRef.current || !embedUrl) return;

    let player: Player | null = null;
    let isMounted = true;

    const initializePlayer = async () => {
      try {
        player = new Player(iframeRef.current!);
        playerRef.current = player;

        await player.ready();
        if (!isMounted) return;

        const duration = await player.getDuration().catch(() => 0);

        // Restore Progress from LocalStorage without clearing it
        if (progressKey) {
          const savedTime = localStorage.getItem(progressKey);

          if (savedTime) {
            const time = Number(savedTime);

            if (!isNaN(time) && time > 0) {
              const END_TOLERANCE = 1.5;

              if (time >= duration - END_TOLERANCE) {
                // Video already completed
                maxWatchedRef.current = duration;
                setIsTimeUp(true);
                setIsPlaying(false);
                setTimeLeft(0);
              } else {
                // Resume from exact saved timestamp
                maxWatchedRef.current = time;
                setIsTimeUp(false);

                const remaining = Math.max(0, Math.floor(duration - time));
                setTimeLeft(remaining);

                await player.setCurrentTime(time).catch(() => { });
              }
            } else {
              setTimeLeft(Math.floor(duration));
            }
          } else {
            setTimeLeft(Math.floor(duration));
          }
        } else {
          setTimeLeft(Math.floor(duration));
        }

        // --- PLAY EVENT ---
        player.on("play", () => {
          if (!isMounted) return;
          setIsPlaying(true);
          setHasStarted(true);
          setIsTimeUp(false);
        });

        // --- PAUSE EVENT ---
        player.on("pause", async () => {
          if (!isMounted) return;
          setIsPlaying(false);
          if (progressKey && player) {
            const cur = await player.getCurrentTime().catch(() => 0);
            if (cur > 0) localStorage.setItem(progressKey, String(cur));
          }
        });

        // --- TIME UPDATE EVENT ---
        player.on("timeupdate", (data: { seconds: number }) => {
          if (!isMounted) return;
          const time = data.seconds;

          if (time > maxWatchedRef.current) {
            maxWatchedRef.current = time;
          }

          // Exact real-time countdown sync
          const remaining = Math.max(0, Math.floor(duration - time));
          setTimeLeft(remaining);

          if (progressKey && time > 0) {
            localStorage.setItem(progressKey, String(time));
          }
        });

        // --- SEEKED EVENT (Anti-Seeking) ---
        player.on("seeked", async () => {
          if (!isMounted || !player) return;
          try {
            const time = await player.getCurrentTime();
            const maxWatched = maxWatchedRef.current;

            if (time > maxWatched + 1.5 || time < maxWatched - 1.5) {
              await player.setCurrentTime(maxWatched).catch(() => { });
            }
          } catch (err) { }
        });

        // --- ENDED EVENT ---
        player.on("ended", async () => {
          if (!isMounted) return;
          setIsPlaying(false);
          setIsTimeUp(true);
          setTimeLeft(0);
          maxWatchedRef.current = duration;
          if (progressKey) {
            localStorage.setItem(progressKey, String(duration));
          }
        });

      } catch (err) {
        console.error("Vimeo Player Initialization Error:", err);
      }
    };

    const iframe = iframeRef.current;
    if (iframe.contentWindow && iframe.contentDocument) {
      initializePlayer();
    } else {
      iframe.onload = initializePlayer;
    }

    return () => {
      isMounted = false;
      if (player) {
        player.destroy().catch(() => { });
      }
      playerRef.current = null;
    };
  }, [isVimeo, embedUrl, progressKey]);

  // =========================================================================
  // 5. YOUTUBE SDK INTERCEPTOR (Original Code - UNCHANGED)
  // =========================================================================
  useEffect(() => {
    if (!isYouTube || !iframeRef.current || !embedUrl || completed) return;

    // @ts-ignore
    if (window.YT && window.YT.Player) {
      // @ts-ignore
      ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            setTimeLeft(Math.floor(event.target.getDuration()));
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              setHasStarted(true);
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            } else if (event.data === 0) {
              setIsPlaying(false);
              setIsTimeUp(true);
              setHasStarted(false);

              if (event.target && typeof event.target.getDuration === "function") {
                setTimeLeft(Math.floor(event.target.getDuration()));
              }

              if (iframeRef.current) {
                iframeRef.current.src = embedUrl;
              }
            }
          }
        }
      });
    }
  }, [isYouTube, embedUrl, completed]);

  // =========================================================================
  // 6. PLAY / PAUSE / REPLAY HANDLER
  // =========================================================================
  const handlePlayPause = async () => {
    if (!playerRef.current) return;

    const player = playerRef.current;

    try {
      // REPLAY FLOW (If video was completed/ended and user clicks replay overlay)
      if (isTimeUp) {
        maxWatchedRef.current = 0;
        setIsTimeUp(false);
        setHasStarted(true);
        if (progressKey) localStorage.removeItem(progressKey);

        await player.setCurrentTime(0).catch(() => { });
        await player.play().catch(() => { });
        setIsPlaying(true);
        return;
      }

      // PAUSE FLOW
      if (isPlaying) {
        await player.pause().catch(() => { });
        setIsPlaying(false);
        return;
      }

      // PLAY FLOW
      await player.play().catch(() => { });
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback toggle error:", error);
    }
  };

  if (vimeoLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <i className="ri-loader-4-line text-3xl text-primary-500 animate-spin"></i>
        <span className="text-sm font-medium text-foreground-500">
          Loading video details...
        </span>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-foreground-400">
        <i className="ri-video-off-line text-3xl"></i>
        <span className="text-sm font-medium">
          Invalid Video Parameter or Address
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        className="relative w-full rounded-3xl overflow-hidden bg-background-950 shadow-xl group/player"
        style={{ aspectRatio: "16 / 9", minHeight: "75vh" }}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={vimeoVideo?.name || title}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className={`absolute inset-0 w-full h-full ${isVimeo ? "pointer-events-none" : ""}`}
        />

        {/* ─── VIMEO CUSTOM OVERLAY PLAY / PAUSE / REPLAY BUTTON ─── */}
        {isVimeo && !completed && (
          <div
            onClick={handlePlayPause}
            className={`absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer transition-opacity duration-300
              ${showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          >
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white/90 text-black shadow-2xl transform transition-transform duration-200 hover:scale-110 active:scale-95">
              <i className={`text-4xl ${isTimeUp ? "ri-refresh-line" : isPlaying ? "ri-pause-fill" : "ri-play-fill ml-1"}`}></i>
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM ACTION BUTTON & COUNTDOWN DISPLAY ─── */}
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
                    ? `Watching video... (${formatRemainingTime(timeLeft)} remaining)`
                    : `Video paused. Resume playback to continue watching (${formatRemainingTime(timeLeft)} remaining)`
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