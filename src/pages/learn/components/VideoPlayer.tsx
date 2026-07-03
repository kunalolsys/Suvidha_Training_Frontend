// import { useState, useEffect, useRef, ReactNode } from 'react';

// interface VideoPlayerProps {
//   veedUrl: string;
//   title: string;
//   completed?: boolean;
//   onComplete?: () => void;
//   children?: ReactNode;
// }

// const formatRemainingTime = (seconds: number): string => {
//   const mins = Math.floor(seconds / 60);
//   const secs = seconds % 60;
//   return `${mins}:${secs.toString().padStart(2, '0')}`;
// };

// // Helper function to extract Video ID and return a secure player embed URL
// const getVimeoEmbedUrl = (rawUrl: string): string => {
//   if (!rawUrl) return "";
//   try {
//     const match = rawUrl.match(/(?:vimeo\.com\/|video\/)(\d+)/);
//     if (match && match[1]) {
//       const videoId = match[1];
//       return `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&api=1`;
//     }
//   } catch (error) {
//     console.error("Error formatting Vimeo URL:", error);
//   }
//   return rawUrl;
// };

// export default function VideoPlayer({ veedUrl, title, completed = false, onComplete }: VideoPlayerProps) {
//   const [hasStarted, setHasStarted] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [isTimeUp, setIsTimeUp] = useState(false); // Flags when the full video runtime has finished

//   const iframeRef = useRef<HTMLIFrameElement>(null);
//   const embedUrl = getVimeoEmbedUrl(veedUrl);

//   // NATIVE VIMEO SDK EVENT BINDING
//   useEffect(() => {
//     if (!iframeRef.current || completed) return;

//     const initializeVimeoPlayer = () => {
//       if (window.Vimeo && window.Vimeo.Player) {
//         const player = new window.Vimeo.Player(iframeRef.current);

//         // Fetch total duration to set up our matching countdown limit
//         player.getDuration().then((durationInSeconds: number) => {
//           setTimeLeft(Math.floor(durationInSeconds));
//         }).catch((err: any) => {
//           console.error("Failed to fetch Vimeo metadata:", err);
//         });

//         // Track Play state
//         player.on('play', () => {
//           setHasStarted(true);
//           setIsPlaying(true);
//         });

//         // Track Pause state
//         player.on('pause', () => {
//           setIsPlaying(false);
//         });

//         // Track Video Ended state (Enables button but DOES NOT trigger onComplete automatically anymore)
//         player.on('ended', () => {
//           setIsPlaying(false);
//           setIsTimeUp(true);
//           setTimeLeft(0);
//         });
//       }
//     };

//     const timeout = setTimeout(initializeVimeoPlayer, 100);
//     return () => clearTimeout(timeout);
//   }, [embedUrl, completed]);

//   // COUNTDOWN TIMELINE LOOP
//   useEffect(() => {
//     if (!hasStarted || !isPlaying || completed || isTimeUp) return;

//     const interval = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           setIsTimeUp(true); // Toggles state to unlock the button user action
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [hasStarted, isPlaying, completed, isTimeUp]);

//   return (
//     <div className="w-full max-w-7xl mx-auto">
//       <div
//         className="relative w-full rounded-3xl overflow-hidden bg-background-950 shadow-xl"
//         style={{ aspectRatio: "16 / 9", minHeight: "75vh" }}
//       >
//         <iframe
//           ref={iframeRef}
//           src={embedUrl}
//           title={title}
//           frameBorder="0"
//           allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
//           referrerPolicy="strict-origin-when-cross-origin"
//           className="absolute inset-0 w-full h-full"
//         />
//       </div>

//       <div className="mt-6 flex items-center justify-center">
//         {completed ? (
//           <div className="flex items-center gap-2 px-5 py-2.5 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
//             <i className="ri-checkbox-circle-fill text-lg"></i>
//             <span>Video completed &mdash; Quiz locked</span>
//           </div>
//         ) : (
//           <button
//             onClick={onComplete} // Clicking explicitly fires your complete workflow route
//             disabled={!isTimeUp}
//             className={`group flex items-center gap-3 px-8 py-4 font-semibold rounded-2xl text-base transition-all shadow-lg whitespace-nowrap
//               ${isTimeUp
//                 ? "bg-primary-500 hover:bg-primary-600 text-background-50 shadow-primary-500/20 hover:shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
//                 : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none select-none"
//               }`}
//           >
//             <i className={isTimeUp
//               ? "ri-check-double-line text-xl"
//               : isPlaying
//                 ? "ri-time-line text-xl animate-spin text-primary-500"
//                 : "ri-pause-circle-line text-xl text-yellow-500 animate-pulse"
//             }></i>
//             <span>
//               {isTimeUp
//                 ? "I've Finished Watching — Unlock Quiz"
//                 : !hasStarted
//                   ? "Click Play on the video to start tracking"
//                   : isPlaying
//                     ? `Watching video... (${formatRemainingTime(timeLeft)})`
//                     : `Video paused! Resume video to continue countdown (${formatRemainingTime(timeLeft)})`
//               }
//             </span>
//             {isTimeUp && (
//               <i className="ri-arrow-right-line text-xl group-hover:translate-x-1 transition-transform"></i>
//             )}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect, useRef, ReactNode } from 'react';

interface VideoPlayerProps {
  veedUrl: string; // Accepts YouTube or Vimeo URL straight from DB
  title: string;
  completed?: boolean;
  onComplete?: () => void;
  children?: ReactNode;
}

const formatRemainingTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({ veedUrl, title, completed = false, onComplete }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // Automatically populated directly from player metadata buffers
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);

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
        
        // controls=0: removes the bar
        // disablekb=1: blocks arrow keys
        return ytId ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&controls=0&disablekb=1` : "";
      }
      if (isVimeo) {
        const match = veedUrl.match(/(?:vimeo\.com\/|video\/)(\d+)/);
        const vimeoId = match && match[1] ? match[1] : null;
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&api=1` : "";
      }
    } catch (e) {
      console.error("Error formatting URL:", e);
    }
    return veedUrl;
  })();

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

    // Platform Track B: Native YouTube Event Interceptor
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
        className="relative w-full rounded-3xl overflow-hidden bg-background-950 shadow-xl"
        style={{ aspectRatio: "16 / 9", minHeight: "75vh" }}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
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
                    : `Video paused! Resume video to continue countdown (${formatRemainingTime(timeLeft)})`
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