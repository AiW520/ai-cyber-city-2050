"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  Maximize,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sun,
  Search,
  Building2,
  Bot,
  TrainFront,
  Trees,
  SlidersHorizontal,
  Info,
  Hand,
  MousePointer2,
  ChevronDown,
  Settings2,
  ArrowUpLeft,
} from "lucide-react";
import {
  assetPath,
  chapters,
  type CameraView,
  type Quality,
} from "./city-data";
import type { CitySceneProps } from "./CityScene";

const CityScene = dynamic(() => import("./CityScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-status" role="status">
      CONNECTING TO CITY...
    </div>
  ),
});

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function CityExplorer({
  active,
  onSelect,
  entered,
  entryView,
  onEnter,
  onExit,
}: {
  active: number;
  onSelect: (index: number) => void;
  entered: boolean;
  entryView: CameraView;
  onEnter: () => void;
  onExit: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [quality, setQuality] = useState<Quality>("auto");
  const [autoLow, setAutoLow] = useState(false);
  const [night, setNight] = useState(false);
  const [view, setView] = useState<CameraView>("overview");
  const [reset, setReset] = useState(0);
  const [command, setCommand] = useState<CitySceneProps["command"]>(null);
  const [visible, setVisible] = useState(true);
  const [tour, setTour] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [touchCamera, setTouchCamera] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const inView = useRef(true);
  const low = quality === "low" || (quality === "auto" && autoLow);
  const failure = useCallback(() => {
    setFailed(true);
    setReady(false);
    setTour(false);
  }, []);
  const sceneReady = useCallback(() => setReady(true), []);
  const slow = useCallback(() => setAutoLow(true), []);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(preference.matches);
      if (preference.matches) {
        setPaused(true);
        setTour(false);
      }
    };
    sync();
    preference.addEventListener("change", sync);
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    setAutoLow(
      (device.deviceMemory ?? 8) <= 4 ||
        navigator.hardwareConcurrency <= 4 ||
        !!device.connection?.saveData ||
        matchMedia("(max-width: 600px)").matches,
    );
    setDetailsOpen(matchMedia("(min-width: 801px)").matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        setVisible(entry.isIntersecting && !document.hidden);
      },
      { threshold: 0.05 },
    );
    if (viewport.current) observer.observe(viewport.current);
    const visibility = () => setVisible(!document.hidden && inView.current);
    document.addEventListener("visibilitychange", visibility);
    const full = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", full);
    return () => {
      preference.removeEventListener("change", sync);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", full);
    };
  }, []);
  useEffect(() => {
    if (entered) {
      const available = supportsWebGL();
      setSupported(available);
      if (!available) failure();
      setView(entryView);
      viewport.current?.focus({ preventScroll: true });
    } else {
      setReady(false);
      setTour(false);
      setSupported(false);
    }
  }, [entered, entryView, failure]);
  useEffect(() => {
    if (!tour || paused || !visible || !entered || reduced) return;
    const timer = setInterval(() => {
      setView("district");
      onSelect((active + 1) % chapters.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [tour, paused, visible, entered, reduced, active, onSelect]);
  const select = (index: number) => {
    setTour(false);
    setView("district");
    onSelect(index);
  };
  const move = (action: NonNullable<CitySceneProps["command"]>["action"]) =>
    setCommand({ id: Date.now() + Math.random(), action });
  const enter = () => {
    setFailed(false);
    onEnter();
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await viewport.current?.requestFullscreen();
    } catch {
      setFullscreen(false);
    }
  };
  const chapter = chapters[active];
  const leave = () => {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => setFullscreen(false));
    setHudOpen(false);
    setTouchCamera(false);
    onExit();
  };
  return (
    <div
      ref={viewport}
      className={`city-viewport ${entered ? "is-entered" : ""} ${fullscreen ? "is-fullscreen" : ""} ${touchCamera ? "touch-camera" : "touch-scroll"}`}
      tabIndex={entered ? 0 : -1}
      aria-label="2050 city scene"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !entered) return;
        const actions = {
          ArrowLeft: "left",
          ArrowRight: "right",
          "+": "in",
          "=": "in",
          "-": "out",
        } as const;
        if (event.key in actions) {
          event.preventDefault();
          move(actions[event.key as keyof typeof actions]);
        }
        if (event.key === " ") {
          event.preventDefault();
          setPaused((value) => !value);
        }
        if (event.key === "Escape") leave();
      }}
    >
      <div className="scene-stage">
        {entered && supported && !failed && (
          <SceneBoundary onFailure={failure}>
            <CityScene
              active={active}
              view={view}
              reset={reset}
              low={low}
              paused={paused || !visible}
              reduced={reduced}
              night={night}
              touchCamera={touchCamera}
              command={command}
              onSelect={select}
              onReady={sceneReady}
              onFailure={failure}
              onSlow={slow}
            />
          </SceneBoundary>
        )}
        {(!entered || failed) && (
          <picture>
            <source
              media="(max-width: 800px)"
              srcSet={assetPath("city-preview-mobile.webp")}
            />
            <img
              className="city-poster"
              src={assetPath("city-preview.webp")}
              alt="An aerial view of the 2050 city: adaptive towers, a service quarter, elevated rail and living gardens."
            />
          </picture>
        )}
        {!entered && <div className="poster-shade" />}
        {entered && !ready && !failed && (
          <div className="loading-indicator" role="status">
            <span /> 正在准备城市场景
          </div>
        )}
        {entered && (
          <>
            <div className="scene-topbar">
              <span className="scene-label">
                <i />{" "}
                {failed ? "城市静态档案" : ready ? "东京 · 2050" : "正在加载"}
              </span>
              <button
                className="scene-return"
                aria-label="Return to city story"
                title="返回城市介绍"
                onClick={leave}
              >
                <ArrowUpLeft size={16} /> 返回介绍
              </button>
              <div className={`scene-tools ${hudOpen ? "hud-open" : ""}`}>
                {!failed && (
                  <>
                    <button
                      className="touch-toggle"
                      aria-label={
                        touchCamera ? "Scroll page" : "Control camera"
                      }
                      title={touchCamera ? "页面滚动" : "操作镜头"}
                      aria-pressed={touchCamera}
                      onClick={() => setTouchCamera((value) => !value)}
                    >
                      {touchCamera ? <Hand /> : <MousePointer2 />}
                      <span>{touchCamera ? "镜头" : "滚动"}</span>
                    </button>
                    <button
                      className="hud-toggle"
                      title="场景设置"
                      aria-label="Scene settings"
                      aria-expanded={hudOpen}
                      onClick={() => setHudOpen((value) => !value)}
                    >
                      <Settings2 />
                    </button>
                  </>
                )}
                {!failed && (
                  <>
                    <button
                      className="hud-action"
                      title={paused ? "继续城市运动" : "暂停城市运动"}
                      aria-label={
                        paused ? "Resume city motion" : "Pause city motion"
                      }
                      aria-pressed={paused}
                      onClick={() => setPaused((value) => !value)}
                    >
                      {paused ? <Play /> : <Pause />}
                    </button>
                    <button
                      className="hud-action"
                      title={night ? "日光场景" : "夜景照明"}
                      aria-label={night ? "Daylight" : "Night lighting"}
                      onClick={() => setNight((value) => !value)}
                    >
                      {night ? <Sun /> : <Moon />}
                    </button>
                    <button
                      className="hud-action"
                      title="重置镜头"
                      aria-label="Reset camera"
                      onClick={() => {
                        setView("overview");
                        setReset((value) => value + 1);
                        setTour(false);
                      }}
                    >
                      <RotateCcw />
                    </button>
                    <button
                      className="hud-action"
                      title={fullscreen ? "退出全屏" : "全屏查看"}
                      aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                      onClick={toggleFullscreen}
                    >
                      <Maximize />
                    </button>
                  </>
                )}
              </div>
            </div>
            {failed && (
              <div className="fallback-message" role="status">
                <h2>城市故事，依然开放。</h2>
                <p>当前设备无法显示 3D。仍可浏览四个街区及城市介绍。</p>
                <button
                  className="primary-cta"
                  onClick={() => {
                    setFailed(false);
                    setReady(false);
                    const available = supportsWebGL();
                    setSupported(available);
                    if (!available) failure();
                    else setReset((value) => value + 1);
                  }}
                >
                  重试 3D <RotateCcw size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {entered && (
        <>
          <div className="scene-bottom">
            <div
              className={`district-info ${detailsOpen ? "details-open" : ""}`}
              style={{ "--district": chapter.accent } as React.CSSProperties}
            >
              <p className="section-kicker">
                {chapter.num} / {chapter.zh.label} · {chapter.label}
              </p>
              <div className="district-heading">
                <h2>{chapter.zh.place}</h2>
                <button
                  className="detail-toggle"
                  title="街区详情"
                  aria-label="District details"
                  aria-expanded={detailsOpen}
                  onClick={() => setDetailsOpen((value) => !value)}
                >
                  <Info size={16} />
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="detail-body">
                <h3>{chapter.zh.title}</h3>
                <p>{chapter.zh.copy}</p>
                <small>{chapter.place}</small>
                <a href={`#${chapter.id}`}>
                  查看城市介绍 <ArrowRight size={14} />
                </a>
              </div>
            </div>
            <div className="scene-controls">
              <div className="district-search-row">
                <span className="index-label">街区索引 / DISTRICTS</span>
                <label className="district-search">
                  <Search size={14} />
                  <input
                    type="search"
                    aria-label="Search city districts"
                    placeholder="搜索街区"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>
              <div
                className="district-tabs"
                role="group"
                aria-label="City districts"
              >
                {chapters.map((item, index) =>
                  !`${item.zh.place} ${item.zh.label} ${item.place} ${item.label} ${item.copy}`
                    .toLowerCase()
                    .includes(query.toLowerCase().trim()) ? null : (
                    <button
                      key={item.id}
                      aria-pressed={active === index}
                      aria-label={item.place}
                      title={item.zh.place + " / " + item.place}
                      onClick={() => select(index)}
                      style={
                        { "--district": item.accent } as React.CSSProperties
                      }
                    >
                      <span>{item.num}</span>
                      {(() => {
                        const Icon = [Building2, Bot, TrainFront, Trees][index];
                        return <Icon size={18} aria-hidden="true" />;
                      })()}
                      <b className="district-full">{item.zh.place}</b>
                      <b className="district-short">
                        {["双塔", "机器人", "交通", "花园"][index]}
                      </b>
                    </button>
                  ),
                )}
              </div>
              {!chapters.some((item) =>
                `${item.zh.place} ${item.zh.label} ${item.place} ${item.label} ${item.copy}`
                  .toLowerCase()
                  .includes(query.toLowerCase().trim()),
              ) && (
                <div className="district-empty" role="status">
                  没有匹配的街区。
                  <button onClick={() => setQuery("")}>清除搜索</button>
                </div>
              )}
              {!failed && (
                <div
                  className={`camera-toolbar ${toolsOpen ? "tools-open" : ""}`}
                >
                  <div
                    className="camera-modes"
                    role="group"
                    aria-label="Camera view"
                  >
                    {(["overview", "district", "street"] as CameraView[]).map(
                      (mode) => (
                        <button
                          key={mode}
                          aria-pressed={view === mode}
                          aria-label={mode}
                          onClick={() => {
                            setView(mode);
                            setReset((value) => value + 1);
                            setTour(false);
                          }}
                        >
                          {
                            {
                              overview: "总览",
                              district: "街区",
                              street: "街道",
                            }[mode]
                          }
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className="more-tools"
                    aria-label="Camera settings"
                    title="镜头与画质"
                    aria-expanded={toolsOpen}
                    onClick={() => setToolsOpen((value) => !value)}
                  >
                    <SlidersHorizontal size={18} />
                    <ChevronDown size={14} />
                  </button>
                  <div className="camera-extra">
                    <div className="camera-buttons">
                      <button
                        aria-label="Rotate camera left"
                        title="向左旋转"
                        onClick={() => move("left")}
                      >
                        <ArrowLeft />
                      </button>
                      <button
                        aria-label="Rotate camera right"
                        title="向右旋转"
                        onClick={() => move("right")}
                      >
                        <ArrowRight />
                      </button>
                      <button
                        aria-label="Zoom in"
                        title="放大"
                        onClick={() => move("in")}
                      >
                        <Plus />
                      </button>
                      <button
                        aria-label="Zoom out"
                        title="缩小"
                        onClick={() => move("out")}
                      >
                        <Minus />
                      </button>
                    </div>
                    <label className="quality-control">
                      画质{" "}
                      <select
                        aria-label="Scene quality"
                        value={quality}
                        onChange={(event) =>
                          setQuality(event.target.value as Quality)
                        }
                      >
                        <option value="auto">
                          自动{autoLow ? " · 节能" : ""}
                        </option>
                        <option value="low">节能</option>
                        <option value="high">高清</option>
                      </select>
                    </label>
                    {!reduced && (
                      <button
                        className="tour-button"
                        aria-label="CITY TOUR"
                        aria-pressed={tour}
                        onClick={() => {
                          setTour((value) => !value);
                          setPaused(false);
                          setView("district");
                        }}
                      >
                        {tour ? <Pause size={14} /> : <Play size={14} />}{" "}
                        城市导览
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <span className="sr-only" aria-live="polite">
            {chapter.zh.place}。{chapter.zh.title}
          </span>
        </>
      )}
      {!entered && (
        <button className="scene-entry" onClick={enter}>
          <Expand size={16} /> 进入 3D 城市 <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
