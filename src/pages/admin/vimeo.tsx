import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { api } from "@/api/api";
import { API } from "@/api/endpoints";

export default function VimeoTest() {
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isPlaying, setIsPlaying] = useState(false);
    const [isEnded, setIsEnded] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const iframeRef = useRef(null);
    const playerRef = useRef(null);

    // Maximum position watched by user
    const maxWatchedRef = useRef(0);

    const videoId = "1206750181";

    const progressKey = `vimeo-progress-${videoId}`;


    // ============================================
    // GET VIMEO VIDEO
    // ============================================
    useEffect(() => {
        let mounted = true;

        const fetchVideo = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    `${API.VIMEO}/${videoId}`
                );

                console.log(
                    "Vimeo API Response:",
                    response
                );

                if (!mounted) {
                    return;
                }

                if (!response?.video) {
                    throw new Error(
                        "Vimeo video data not found"
                    );
                }

                setVideo(response.video);

            } catch (error) {
                console.error(
                    "Fetch Vimeo video error:",
                    error
                );

                if (mounted) {
                    setError(
                        error?.response?.data?.message ||
                        error?.message ||
                        "Failed to load video"
                    );
                }

            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchVideo();

        return () => {
            mounted = false;
        };
    }, []);


    // ============================================
    // INITIALIZE VIMEO PLAYER
    // ============================================
    useEffect(() => {
        if (!video?.player_embed_url) {
            return;
        }

        const iframe = iframeRef.current;

        if (!iframe) {
            console.log(
                "Iframe not available yet"
            );

            return;
        }

        let player = null;
        let destroyed = false;


        // ========================================
        // INITIALIZE PLAYER
        // ========================================
        const initializePlayer = async () => {
            try {
                console.log(
                    "Initializing Vimeo player..."
                );

                player = new Player(iframe);

                playerRef.current = player;

                await player.ready();

                if (destroyed) {
                    return;
                }

                console.log(
                    "Vimeo player is READY"
                );


                // ==================================
                // GET SAVED PROGRESS
                // ==================================
                // ==================================
                // GET SAVED PROGRESS
                // ==================================
                const savedTime = localStorage.getItem(progressKey);

                if (savedTime) {
                    const time = Number(savedTime);

                    if (!isNaN(time) && time >= 0) {
                        console.log("Saved video position:", time);

                        // Vimeo duration may not be available immediately,
                        // so get it directly from the player.
                        const duration = await player.getDuration();

                        // Small tolerance to handle floating-point differences
                        const END_TOLERANCE = 1;

                        // ==================================
                        // VIDEO WAS ALREADY COMPLETED
                        // ==================================
                        if (time >= duration - END_TOLERANCE) {
                            console.log("Video was already completed");

                            maxWatchedRef.current = duration;

                            setCurrentTime(duration);

                            setIsEnded(true);

                            setIsPlaying(false);

                            // Keep the saved duration in localStorage
                            localStorage.setItem(
                                progressKey,
                                String(duration)
                            );

                            // Do NOT seek to duration here.
                            // Keep player ready for Replay.
                        }

                        // ==================================
                        // VIDEO WAS PARTIALLY WATCHED
                        // ==================================
                        else if (time > 0) {
                            console.log(
                                "Restoring video from:",
                                time
                            );

                            maxWatchedRef.current = time;

                            setCurrentTime(time);

                            setIsEnded(false);

                            try {
                                await player.setCurrentTime(time);

                                console.log(
                                    "Video position restored"
                                );

                            } catch (error) {
                                console.error(
                                    "Could not restore video position:",
                                    error
                                );
                            }
                        }
                    }
                }


                // ==================================
                // PLAY
                // ==================================
                const handlePlay = () => {
                    if (destroyed) {
                        return;
                    }

                    setIsPlaying(true);
                    setIsEnded(false);
                };


                // ==================================
                // PAUSE
                // ==================================
                const handlePause = async () => {
                    if (destroyed) {
                        return;
                    }

                    setIsPlaying(false);

                    try {
                        const currentTime =
                            await player.getCurrentTime();

                        localStorage.setItem(
                            progressKey,
                            String(currentTime)
                        );

                        console.log(
                            "Video paused at:",
                            currentTime
                        );

                    } catch (error) {
                        console.error(
                            "Pause save error:",
                            error
                        );
                    }
                };


                // ==================================
                // TIME UPDATE
                // ==================================
                const handleTimeUpdate = (
                    data
                ) => {
                    if (destroyed) {
                        return;
                    }

                    const time =
                        data.seconds;

                    setCurrentTime(
                        time
                    );


                    // Update maximum watched position
                    if (
                        time >
                        maxWatchedRef.current
                    ) {
                        maxWatchedRef.current =
                            time;
                    }


                    // Save progress
                    localStorage.setItem(
                        progressKey,
                        String(time)
                    );
                };


                // ==================================
                // SEEKED
                // ==================================
                const handleSeeked =
                    async () => {

                        if (destroyed) {
                            return;
                        }

                        try {

                            const currentTime =
                                await player.getCurrentTime();

                            const maxWatched =
                                maxWatchedRef.current;


                            /*
                             * Prevent forward seeking.
                             *
                             * User cannot jump from
                             * 10 sec directly to
                             * 100 sec.
                             */
                            if (
                                currentTime >
                                maxWatched + 1
                            ) {

                                console.log(
                                    "Forward seeking blocked"
                                );

                                await player.setCurrentTime(
                                    maxWatched
                                );

                                return;
                            }


                            /*
                             * Prevent backward seeking.
                             *
                             * User cannot drag backward
                             * to replay an earlier part.
                             */
                            if (
                                currentTime <
                                maxWatched - 1
                            ) {

                                console.log(
                                    "Backward seeking blocked"
                                );

                                await player.setCurrentTime(
                                    maxWatched
                                );
                            }

                        } catch (error) {

                            console.error(
                                "Seek handling error:",
                                error
                            );

                        }
                    };


                // ==================================
                // VIDEO ENDED
                // ==================================
                // ==================================
                // VIDEO ENDED
                // ==================================
                const handleEnded = async () => {
                    if (destroyed) {
                        return;
                    }

                    console.log("Video completed");

                    try {
                        // Get exact duration from Vimeo
                        const duration = await player.getDuration();

                        // Save completed position
                        localStorage.setItem(
                            progressKey,
                            String(duration)
                        );

                        // Update refs/state
                        maxWatchedRef.current = duration;

                        setCurrentTime(duration);

                        setIsPlaying(false);

                        setIsEnded(true);

                        console.log(
                            "Video completed and progress saved:",
                            duration
                        );

                    } catch (error) {
                        console.error(
                            "Error saving completed video:",
                            error
                        );

                        // Fallback to video.duration from API
                        const duration = Number(video.duration) || 0;

                        localStorage.setItem(
                            progressKey,
                            String(duration)
                        );

                        maxWatchedRef.current = duration;

                        setCurrentTime(duration);

                        setIsPlaying(false);

                        setIsEnded(true);
                    }
                };

                // ==================================
                // REGISTER EVENTS
                // ==================================

                player.on(
                    "play",
                    handlePlay
                );

                player.on(
                    "pause",
                    handlePause
                );

                player.on(
                    "timeupdate",
                    handleTimeUpdate
                );

                player.on(
                    "seeked",
                    handleSeeked
                );

                player.on(
                    "ended",
                    handleEnded
                );


                // ==================================
                // CLEANUP
                // ==================================
                return () => {

                    player.off(
                        "play",
                        handlePlay
                    );

                    player.off(
                        "pause",
                        handlePause
                    );

                    player.off(
                        "timeupdate",
                        handleTimeUpdate
                    );

                    player.off(
                        "seeked",
                        handleSeeked
                    );

                    player.off(
                        "ended",
                        handleEnded
                    );

                };

            } catch (error) {

                if (!destroyed) {

                    console.error(
                        "Vimeo Player Error:",
                        error
                    );

                }

            }
        };


        // ========================================
        // WAIT FOR IFRAME
        // ========================================
        if (
            iframe.contentWindow &&
            iframe.contentDocument
        ) {

            initializePlayer();

        } else {

            iframe.onload =
                initializePlayer;

        }


        // ========================================
        // CLEANUP
        // ========================================
        return () => {

            destroyed = true;

            if (player) {

                try {

                    player.destroy();

                } catch (error) {

                    console.log(
                        "Player cleanup:",
                        error
                    );

                }

                player = null;

            }

            if (
                playerRef.current
            ) {

                playerRef.current =
                    null;

            }

        };

    }, [
        video,
        progressKey,
    ]);


    // ============================================
    // PLAY / PAUSE / REPLAY
    // ============================================
    const handlePlayPause = async () => {

        if (
            !playerRef.current
        ) {
            return;
        }

        try {

            // ================================
            // REPLAY
            // ================================
            if (isEnded) {
                try {
                    // Clear old completed progress
                    localStorage.removeItem(progressKey);

                    // Reset internal progress
                    maxWatchedRef.current = 0;

                    setCurrentTime(0);

                    setIsEnded(false);

                    setIsPlaying(false);

                    // Move Vimeo player to beginning
                    await playerRef.current.setCurrentTime(0);

                    // Start video again
                    await playerRef.current.play();

                } catch (error) {
                    console.error(
                        "Replay error:",
                        error
                    );
                }

                return;
            }


            // ================================
            // PAUSE
            // ================================
            if (isPlaying) {

                await playerRef.current
                    .pause();

                return;
            }


            // ================================
            // PLAY / RESUME
            // ================================
            await playerRef.current
                .play();

        } catch (error) {

            console.error(
                "Playback error:",
                error
            );

        }
    };


    // ============================================
    // FORMAT TIME
    // ============================================
    const formatTime = (
        seconds
    ) => {

        const mins =
            Math.floor(
                seconds / 60
            );

        const secs =
            Math.floor(
                seconds % 60
            );

        return `${mins}:${String(
            secs
        ).padStart(
            2,
            "0"
        )}`;
    };


    // ============================================
    // LOADING
    // ============================================
    if (loading) {

        return (
            <div
                style={{
                    padding: "40px",
                    textAlign: "center",
                }}
            >
                <h2>
                    Loading video...
                </h2>
            </div>
        );
    }


    // ============================================
    // ERROR
    // ============================================
    if (error) {

        return (
            <div
                style={{
                    padding: "40px",
                    color: "red",
                }}
            >
                <h2>
                    {error}
                </h2>
            </div>
        );
    }


    // ============================================
    // NO VIDEO
    // ============================================
    if (!video) {

        return (
            <div
                style={{
                    padding: "40px",
                }}
            >
                <h2>
                    Video not found
                </h2>
            </div>
        );
    }


    // ============================================
    // RENDER
    // ============================================
    return (

        <div
            style={{
                maxWidth: "900px",
                margin: "40px auto",
                padding: "20px",
                fontFamily:
                    "Arial, sans-serif",
            }}
        >

            {/* ================================= */}
            {/* VIDEO TITLE */}
            {/* ================================= */}

            <h1
                style={{
                    marginBottom:
                        "10px",
                }}
            >
                Vimeo Video Test
            </h1>

            <h2
                style={{
                    marginBottom:
                        "8px",
                }}
            >
                {video.name}
            </h2>

            <p
                style={{
                    color:
                        "#666",
                    marginBottom:
                        "20px",
                }}
            >
                Duration:{" "}
                {formatTime(
                    video.duration
                )}
            </p>


            {/* ================================= */}
            {/* VIDEO PLAYER */}
            {/* ================================= */}

            <div
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
                style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    backgroundColor: "#000",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "12px",
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.2)",
                }}
            >
                {/* VIMEO IFRAME */}
                <iframe
                    ref={iframeRef}
                    src={
                        `${video.player_embed_url}${video.player_embed_url.includes("?")
                            ? "&"
                            : "?"
                        }controls=0`
                    }
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                        pointerEvents: "none",
                    }}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={video.name}
                />

                {/* CUSTOM PLAY / PAUSE / REPLAY */}
                <div
                    onClick={handlePlayPause}
                    style={{
                        position: "absolute",
                        inset: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",

                        background: showControls
                            ? "rgba(0,0,0,0.15)"
                            : "transparent",

                        opacity: showControls ? 1 : 0,

                        transition:
                            "opacity 0.25s ease, background 0.25s ease",

                        pointerEvents: showControls
                            ? "auto"
                            : "none",
                    }}
                >
                    <button
                        type="button"
                        onClick={handlePlayPause}
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            border: "none",
                            background:
                                "rgba(255,255,255,0.95)",
                            color: "#111",
                            fontSize: "28px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow:
                                "0 10px 30px rgba(0,0,0,0.3)",
                            transform: showControls
                                ? "scale(1)"
                                : "scale(0.9)",
                            transition:
                                "transform 0.2s ease",
                        }}
                    >
                        {isEnded
                            ? "↻"
                            : isPlaying
                                ? "❚❚"
                                : "▶"}
                    </button>
                </div>
            </div>


            {/* ================================= */}
            {/* PLAYER STATUS */}
            {/* ================================= */}

            <div
                style={{
                    marginTop:
                        "20px",

                    padding:
                        "15px 20px",

                    background:
                        "#f5f5f5",

                    borderRadius:
                        "10px",

                    display:
                        "flex",

                    justifyContent:
                        "space-between",

                    alignItems:
                        "center",
                }}
            >

                <div>

                    <strong>
                        Progress
                    </strong>

                    <div
                        style={{
                            marginTop:
                                "5px",

                            color:
                                "#666",
                        }}
                    >
                        {formatTime(
                            currentTime
                        )}
                        {" / "}
                        {formatTime(
                            video.duration
                        )}
                    </div>

                </div>


                <strong
                    style={{
                        color:
                            isEnded
                                ? "green"
                                : isPlaying
                                    ? "#2563eb"
                                    : "#666",
                    }}
                >
                    {isEnded
                        ? "Completed"
                        : isPlaying
                            ? "Playing"
                            : "Paused"}
                </strong>

            </div>


            {/* ================================= */}
            {/* VIMEO ID */}
            {/* ================================= */}

            <p
                style={{
                    marginTop:
                        "15px",

                    fontSize:
                        "13px",

                    color:
                        "#999",

                    textAlign:
                        "center",
                }}
            >
                Vimeo ID: {videoId}
            </p>

        </div>
    );
}