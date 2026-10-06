"use client";

import { useEffect, useRef, useState, type Dispatch, type PointerEvent } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { albums, formatTime, type MusicAction, type MusicState } from "@/lib/music";

const waveform = Array.from(
  { length: 100 },
  (_, i) => Math.round((12 + Math.abs(Math.sin(i * 1.79) * Math.cos(i * 0.24)) * 24) * 100) / 100,
);

export function Player({
  state,
  dispatch,
}: {
  state: MusicState;
  dispatch: Dispatch<MusicAction>;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const knobDrag = useRef<{ y: number; value: number } | null>(null);
  const bigKnobDrag = useRef<{ y: number; value: number } | null>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const [volumeMode, setVolumeMode] = useState(false);

  const album = albums[state.album] ?? albums[0];
  const track = album.tracks[state.track] ?? album.tracks[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setDuration(0);
    if (!state.noSelection) audio.load();
  }, [state.album, state.track, state.noSelection]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || state.noSelection) return;
    audio.volume = state.volume;
    if (state.playing)
      audio
        .play()
        .then(() => setError(""))
        .catch(() => {
          setError("Audio unavailable. Please try again.");
          dispatch({ type: "toggle" });
        });
    else audio.pause();
  }, [state.playing, state.album, state.track, state.volume, state.noSelection, dispatch]);

  // Close volume mode on Escape
  useEffect(() => {
    if (!volumeMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVolumeMode(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [volumeMode]);

  const seek = (value: number) => {
    dispatch({ type: "seek", value });
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, value);
  };
  const pointerSeek = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const volumePct = Math.round(state.volume * 100);
  const knobAngle = -135 + state.volume * 270;

  return (
    <footer
      className={`player-bar${volumeMode ? " player-bar--volume" : ""}${state.noSelection ? " player-bar--idle" : ""}`}
      aria-label="Music player"
    >
      <audio
        ref={audioRef}
        src={state.noSelection ? undefined : track.src}
        preload="auto"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => dispatch({ type: "seek", value: e.currentTarget.currentTime })}
        onEnded={() => dispatch({ type: "skip", direction: 1 })}
      />

      {/* ── Volume mode overlay (mobile) ── */}
      {volumeMode && (
        <div className="volume-overlay" onClick={() => setVolumeMode(false)}>
          <button
            className="volume-overlay-close"
            onClick={() => setVolumeMode(false)}
            aria-label="Close volume"
          >
            <X size={18} />
          </button>
          <div
            className="volume-overlay-knob"
            role="slider"
            tabIndex={0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volumePct}
            aria-valuetext={`${volumePct} percent`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              bigKnobDrag.current = { y: e.clientY, value: state.volume };
            }}
            onPointerMove={(e) => {
              if (bigKnobDrag.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
                dispatch({
                  type: "volume",
                  value: bigKnobDrag.current.value + (bigKnobDrag.current.y - e.clientY) / 160,
                });
              }
            }}
            onPointerUp={() => { bigKnobDrag.current = null; }}
            onPointerCancel={() => { bigKnobDrag.current = null; }}
            onWheel={(e) => {
              e.preventDefault();
              dispatch({ type: "volume", value: state.volume + (e.deltaY < 0 ? 0.05 : -0.05) });
            }}
            onKeyDown={(e) => {
              if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                dispatch({
                  type: "volume",
                  value:
                    e.key === "Home" ? 0
                    : e.key === "End" ? 1
                    : state.volume + (["ArrowUp", "ArrowRight"].includes(e.key) ? 0.05 : -0.05),
                });
              }
            }}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="38" className="big-knob-track" />
              <circle
                cx="50" cy="50" r="38"
                className="big-knob-progress"
                strokeDasharray={`${state.volume * 239} 239`}
                transform="rotate(-225 50 50)"
              />
              <circle cx="50" cy="50" r="30" className="big-knob-body" />
              <line
                x1="50" y1="24" x2="50" y2="32"
                transform={`rotate(${knobAngle} 50 50)`}
                className="big-knob-marker"
              />
            </svg>
            <span className="big-knob-pct">{volumePct}%</span>
          </div>
          <span className="volume-overlay-hint">VOLUME</span>
        </div>
      )}

      {/* ── Song info ── */}
      <div className="player-song">
        {state.noSelection ? (
          <span className="player-idle-text">Hit play on an album to start</span>
        ) : (
          <>
            <img src={album.cover} alt={`${album.title} cover`} />
            <div>
              <span className="song-title">{track.title}</span>
              <span className="song-artist">{album.artist}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Transport ── */}
      <div className="transport">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous track"
          title="Previous track"
          disabled={state.noSelection}
          onClick={() => dispatch({ type: "skip", direction: -1 })}
        >
          <SkipBack />
        </Button>
        <Button
          className="player-play"
          size="icon"
          aria-label={state.playing ? "Pause" : "Resume playback"}
          title={state.playing ? "Pause" : "Play"}
          disabled={state.noSelection}
          onClick={() => dispatch({ type: "toggle" })}
        >
          {state.playing ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next track"
          title="Next track"
          disabled={state.noSelection}
          onClick={() => dispatch({ type: "skip", direction: 1 })}
        >
          <SkipForward />
        </Button>
        {/* Volume toggle — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="volume-toggle-btn"
          aria-label="Adjust volume"
          title="Adjust volume"
          onClick={() => setVolumeMode(true)}
        >
          <Volume2 size={18} />
        </Button>
      </div>

      {/* ── Seek / waveform ── */}
      <div className="seek-area">
        <span>{formatTime(state.elapsed)}</span>
        <svg
          className="waveform"
          viewBox="0 0 500 44"
          preserveAspectRatio="none"
          role="slider"
          tabIndex={0}
          aria-label="Seek playback"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(state.elapsed)}
          aria-valuetext={formatTime(state.elapsed)}
          onPointerDown={(e) => {
            if (state.noSelection) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            pointerSeek(e);
          }}
          onPointerMove={(e) => {
            if (state.noSelection) return;
            if (e.currentTarget.hasPointerCapture(e.pointerId)) pointerSeek(e);
          }}
          onKeyDown={(e) => {
            if (state.noSelection) return;
            if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              seek(
                e.key === "Home" ? 0
                : e.key === "End" ? duration
                : state.elapsed + (e.key === "ArrowRight" ? 5 : -5),
              );
            }
          }}
        >
          {waveform.map((height, i) => (
            <line
              key={i}
              x1={i * 5 + 2}
              x2={i * 5 + 2}
              y1={Math.round(((44 - height) / 2) * 100) / 100}
              y2={Math.round(((44 + height) / 2) * 100) / 100}
              className={
                !state.noSelection && duration > 0 && i / 100 <= state.elapsed / duration
                  ? "wave-played"
                  : "wave-unplayed"
              }
            />
          ))}
        </svg>
        <span>{!state.noSelection && duration > 0 ? `−${formatTime(duration - state.elapsed)}` : "--:--"}</span>
      </div>

      {/* ── Desktop volume knob ── */}
      <div className="volume-area">
        <Volume2 aria-hidden="true" size={17} />
        <div
          className="volume-knob"
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volumePct}
          aria-valuetext={`${volumePct} percent`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            knobDrag.current = { y: e.clientY, value: state.volume };
          }}
          onPointerMove={(e) => {
            if (knobDrag.current && e.currentTarget.hasPointerCapture(e.pointerId))
              dispatch({
                type: "volume",
                value: knobDrag.current.value + (knobDrag.current.y - e.clientY) / 110,
              });
          }}
          onPointerUp={() => { knobDrag.current = null; }}
          onPointerCancel={() => { knobDrag.current = null; }}
          onWheel={(e) => {
            e.preventDefault();
            dispatch({ type: "volume", value: state.volume + (e.deltaY < 0 ? 0.05 : -0.05) });
          }}
          onKeyDown={(e) => {
            if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              dispatch({
                type: "volume",
                value:
                  e.key === "Home" ? 0
                  : e.key === "End" ? 1
                  : state.volume + (["ArrowUp", "ArrowRight"].includes(e.key) ? 0.05 : -0.05),
              });
            }
          }}
        >
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="14" className="knob-body" />
            <line
              x1="22" y1="12" x2="22" y2="16"
              transform={`rotate(${knobAngle} 22 22)`}
              className="knob-marker"
            />
          </svg>
        </div>
        <span className="volume-value">{volumePct}%</span>
      </div>

      {error && (
        <span className="audio-error" role="alert">
          {error}
        </span>
      )}
    </footer>
  );
}
