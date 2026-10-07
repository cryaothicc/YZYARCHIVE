"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Disc3, Github, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { albums, ALBUM_COUNT, initialMusic, musicReducer } from "@/lib/music";
import { Player } from "./Player";
import { albumIndex, loopDistance } from "@/lib/carousel";

const carouselAlbums = [...albums, ...albums, ...albums];
const startingSlide = albums.length + initialMusic.focused;

export function ListeningRoom() {
  const [state, dispatch] = useReducer(musicReducer, initialMusic);
  const [opened, setOpened] = useState(false);
  const [focusedSlide, setFocusedSlide] = useState(startingSlide);
  const [carouselReady, setCarouselReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const trackListRef = useRef<HTMLOListElement>(null);
  const revealAnimation = useRef<Animation | null>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const openedRef = useRef(opened);
  openedRef.current = opened;
  const [viewport, api] = useEmblaCarousel({
    align: "center",
    startIndex: startingSlide,
    loop: true,
    containScroll: false,
    duration: 25,
    watchDrag: () => !openedRef.current,
  });
  const album = albums[state.focused] ?? albums[0];

  // Reset scroll position when focused album changes
  useEffect(() => {
    if (trackListRef.current) {
      trackListRef.current.scrollTop = 0;
    }
  }, [state.focused]);

  useEffect(() => {
    const cover = stage.current?.querySelector<HTMLElement>(".is-focused .album-cover");
    if (!cover || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Cancel any in-flight animation
    if (revealAnimation.current) {
      revealAnimation.current.cancel();
      revealAnimation.current = null;
    }

    if (!opened && !cover.dataset["revealed"]) return;
    cover.dataset["revealed"] = String(opened);

    const restTransform =
      "perspective(1100px) translateY(-40px) translateZ(-85px) rotateY(-9deg) rotateX(8deg) scale(.92)";
    const startTransform =
      "perspective(1100px) translateY(0px) translateZ(0px) rotateY(0deg) rotateX(0deg) scale(1)";

    const animation = cover.animate(
      opened
        ? [{ transform: startTransform }, { transform: restTransform }]
        : [{ transform: restTransform }, { transform: startTransform }],
      {
        duration: opened ? 480 : 380,
        easing: opened ? "cubic-bezier(.22, .8, .25, 1)" : "cubic-bezier(.4, 0, .2, 1)",
        fill: "both",
      },
    );
    revealAnimation.current = animation;
    if (!opened) {
      animation.onfinish = () => {
        animation.cancel();
        revealAnimation.current = null;
      };
    }
  }, [opened]);

  useEffect(
    () => () => {
      revealAnimation.current?.cancel();
    },
    [],
  );
  useEffect(() => {
    if (!api) return;
    const draw = () => {
      const progress = api.scrollProgress();
      const snaps = api.scrollSnapList();
      api.slideNodes().forEach((node, index) => {
        const distance = loopDistance(snaps[index] ?? 0, progress, carouselAlbums.length);
        const amount = Math.min(Math.abs(distance), 2);
        node.style.zIndex = String(Math.round(30 - amount * 10));
        node.style.setProperty("--cover-angle", `${-Math.max(-1, Math.min(1, distance)) * 46}deg`);
        node.style.setProperty("--cover-scale", String(1 - amount * 0.16));
        node.style.setProperty("--cover-depth", `${-amount * 65}px`);
      });
    };
    const select = () => {
      const slide = api.selectedScrollSnap();
      setFocusedSlide(slide);
      dispatch({ type: "focus", index: albumIndex(slide, albums.length) });
      draw();
    };
    api.on("scroll", draw).on("select", select).on("reInit", draw);
    draw();
    setCarouselReady(true);
    return () => {
      api.off("scroll", draw).off("select", select).off("reInit", draw);
    };
  }, [api]);
  const close = () => {
    setOpened(false);
    openButton.current?.focus();
  };
  useEffect(() => {
    if (opened) closeButton.current?.focus();
  }, [opened]);
  return (
    <div className="listening-room">
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="YZY Radio home">
          <Disc3 size={23} strokeWidth={1.4} />
          YZY<span className="wordmark-dot">.</span>
        </Link>
        {/* <span className="header-label">nothing got lost.</span> */}
        <span className="edition">EST. 2003</span>
      </header>
      <section className="collection-heading">
        <div>
          <span className="eyebrow">THE ARCHIVE</span>
          <h1>Good music never dies.</h1>
        </div>
        <span className="collection-count">
          {String(ALBUM_COUNT).padStart(2, "0")} album <span>/</span> unreleased <span>/</span> alt
          version
        </span>
      </section>
      <section
        className={`collection ${opened ? "is-open" : ""} ${carouselReady ? "carousel-ready" : ""}`}
        aria-label="Album collection"
        onKeyDown={(e) => {
          if (e.key === "Escape" && opened) close();
          if (
            !opened &&
            ["ArrowLeft", "ArrowRight"].includes(e.key) &&
            !(e.target instanceof Element && e.target.closest('[role="slider"]'))
          ) {
            e.preventDefault();
            if (e.key === "ArrowLeft") {
              api?.scrollPrev();
            } else {
              api?.scrollNext();
            }
          }
        }}
      >
        <div className="carousel-stage" ref={stage}>
          <Button
            className="carousel-arrow previous"
            variant="ghost"
            size="icon"
            aria-label="Previous album"
            title="Previous album"
            disabled={opened}
            onClick={() => api?.scrollPrev()}
          >
            <ArrowLeft />
          </Button>
          <div
            className="carousel-viewport"
            ref={viewport}
            role="region"
            aria-roledescription="carousel"
            aria-label="Albums"
            tabIndex={0}
            onWheel={(e) => {
              if (opened) return;
              e.preventDefault();
              if (e.deltaY > 0 || e.deltaX > 0) {
                api?.scrollNext();
              } else {
                api?.scrollPrev();
              }
            }}
          >
            <div className="carousel-track">
              {carouselAlbums.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  data-offset={index - focusedSlide}
                  className={`album-slide ${index === focusedSlide ? "is-focused" : ""}`}
                >
                  <Button
                    variant="ghost"
                    className="album-cover"
                    aria-label={`Focus ${item.title} by ${item.artist}`}
                    aria-current={focusedSlide === index ? "true" : undefined}
                    tabIndex={Math.abs(index - focusedSlide) <= 1 && !opened ? 0 : -1}
                    disabled={opened}
                    onClick={() => {
                      if (index !== focusedSlide) {
                        api?.scrollTo(index);
                      } else {
                        setOpened(true);
                      }
                    }}
                  >
                    <img src={item.cover} alt={`${item.title} album artwork`} draggable={false} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button
            className="carousel-arrow next"
            variant="ghost"
            size="icon"
            aria-label="Next album"
            title="Next album"
            disabled={opened}
            onClick={() => api?.scrollNext()}
          >
            <ArrowRight />
          </Button>
          <div
            className="track-panel"
            inert={!opened}
            aria-hidden={!opened}
            aria-label={`${album.title} tracks`}
          >
            <div className="track-panel-header">
              <div>
                <span className="eyebrow">{album.artist}</span>
                <h2>{album.title}</h2>
              </div>
              <Button
                ref={closeButton}
                variant="ghost"
                size="icon"
                onClick={close}
                aria-label="Close album"
                title="Close album"
              >
                <X />
              </Button>
            </div>
            <ol className="track-list" ref={trackListRef}>
              {album.tracks.map((track, index) => {
                const active =
                  state.album === state.focused && state.track === index && state.playing;
                const isBonus = "bonus" in track && track.bonus;
                const prevIsNotBonus =
                  index > 0 &&
                  !(
                    "bonus" in album.tracks[index - 1]! &&
                    (album.tracks[index - 1]! as { bonus?: boolean }).bonus
                  );
                return (
                  <li key={track.title}>
                    {isBonus && prevIsNotBonus && <div className="bonus-divider">BONUS</div>}
                    <Button
                      variant="ghost"
                      className={`track-row ${active ? "active-track" : ""} ${isBonus ? "bonus-track" : ""}`}
                      onClick={() =>
                        dispatch({ type: "track", album: state.focused, track: index })
                      }
                      aria-label={`Play ${track.title}`}
                      aria-current={active ? "true" : undefined}
                    >
                      <span className="track-number">
                        {active ? (
                          <span className="playing-bars" aria-label="Playing">
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <span>{track.title}</span>
                    </Button>
                  </li>
                );
              })}
            </ol>
            <div className="track-panel-footer">{album.tracks.length} tracks</div>
          </div>
        </div>
        <div className="album-details" aria-live="polite">
          <span className="album-index">
            {String(state.focused + 1).padStart(2, "0")}{" "}
            <span>/ {String(ALBUM_COUNT).padStart(2, "0")}</span>
          </span>
          <h2>{album.title}</h2>
          <div className="album-meta">
            <span>{album.year}</span>
          </div>
          <div className="album-actions">
            <Button onClick={() => dispatch({ type: "playAlbum", index: state.focused })}>
              <Play size={15} />
              Play
            </Button>
            <Button
              ref={openButton}
              variant="outline"
              onClick={() => (opened ? close() : setOpened(true))}
            >
              {opened ? "Close album" : "Open album"}
              <ArrowUpRight size={15} />
            </Button>
          </div>
        </div>
      </section>
      <div className="collection-footer">
        <span>From College Dropout to Bully.</span>
        {/* <span>Unreleased, shelved & forgotten. All in one place.</span> */}
        <span className="demo-label">
          <a
            href="https://github.com/cryaothicc"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}
          >
            <Github size={11} strokeWidth={1.5} style={{ flexShrink: 0, position: "relative", top: "0.5px" }} />
            @cryaothicc
          </a>
        </span>
      </div>
      <Player state={state} dispatch={dispatch} />
    </div>
  );
}
