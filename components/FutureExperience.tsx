"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Menu, X } from "lucide-react";
import CityExplorer from "./CityExplorer";
import { chapters, type CameraView } from "./city-data";

export default function FutureExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);
  const [entryView, setEntryView] = useState<CameraView>("overview");
  const entry = useRef<HTMLButtonElement>(null);
  const select = useCallback((index: number) => setActive(index), []);
  const enter = () => {
    setEntered(true);
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const exit = () => {
    setEntered(false);
    requestAnimationFrame(() => entry.current?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    const followHash = () => {
      const index = chapters.findIndex(
        (chapter) => `#${chapter.id}` === location.hash,
      );
      if (index >= 0) setActive(index);
    };
    followHash();
    addEventListener("hashchange", followHash);
    return () => removeEventListener("hashchange", followHash);
  }, []);
  const chapter = chapters[active];
  return (
    <main>
      <a className="skip-link" href="#enter">
        跳到城市介绍
      </a>
      <header className={`nav-shell ${entered ? "scene-active" : ""}`}>
        <a className="brand" href="#top">
          <span className="brand-mark">✦</span>2050
          <span className="brand-muted">AI CYBER CITY</span>
        </a>
        <button
          className="menu-button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="city-navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          id="city-navigation"
          className={menuOpen ? "nav-links is-open" : "nav-links"}
          aria-label="City story"
        >
          {chapters.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-label={item.label.split(" ")[0]}
              onClick={() => {
                setActive(index);
                setMenuOpen(false);
              }}
            >
              {item.zh.label}
            </a>
          ))}
        </nav>
        <button className="nav-cta" onClick={enter}>
          进入城市 <ArrowUpRight size={14} />
        </button>
      </header>
      <section id="top" className={`hero ${entered ? "immersive" : ""}`}>
        <CityExplorer
          active={active}
          onSelect={select}
          entered={entered}
          entryView={entryView}
          onEnter={() => {
            setEntryView("overview");
            enter();
          }}
          onExit={exit}
        />
        {!entered && (
          <>
            <div className="hero-copy-wrap">
              <p className="hero-eyebrow">东京 · 未来城市 / TOKYO 2050</p>
              <h1 className="hero-title">2050 AI Cyber City</h1>
              <p className="hero-copy">
                当智能成为基础设施，城市会是什么模样？
              </p>
              <div className="hero-actions">
                <button
                  ref={entry}
                  className="primary-cta"
                  aria-label="ENTER THE EXPERIENCE"
                  onClick={enter}
                >
                  开始城市探索 <ArrowUpRight size={16} />
                </button>
                <a className="text-cta" href="#architecture">
                  浏览城市介绍 <ArrowDown size={14} />
                </a>
              </div>
            </div>
          </>
        )}
      </section>
      <section id="enter" className="manifesto">
        <p className="section-kicker">城市介绍 / CITY STORY</p>
        <h2>
          不只是天际线，
          <br />
          更是有生命的系统。
        </h2>
        <p>
          2050 AI Cyber City
          是不断演进的城市生命体，连接建筑、机器人与人类的可能性。走进四个街区，看看一座城市学会感知后，生活会如何改变。
        </p>
      </section>
      <section className="chapters" aria-label="City chapters">
        <div
          className="chapter-list"
          role="tablist"
          aria-label="City themes"
          aria-orientation="vertical"
        >
          {chapters.map((item, index) => (
            <button
              id={item.id}
              role="tab"
              aria-selected={active === index}
              aria-controls="chapter-panel"
              tabIndex={active === index ? 0 : -1}
              key={item.id}
              className={active === index ? "chapter active" : "chapter"}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp")
                  return;
                event.preventDefault();
                const next =
                  (index + (event.key === "ArrowDown" ? 1 : -1) + 4) % 4;
                setActive(next);
                document.getElementById(chapters[next].id)?.focus();
              }}
            >
              <span className="chapter-num">{item.num}</span>
              <span>
                <small>
                  {item.zh.label} / {item.label}
                </small>
                <strong>{item.zh.title}</strong>
              </span>
              <ArrowUpRight size={20} />
            </button>
          ))}
        </div>
        <div
          className="chapter-feature"
          id="chapter-panel"
          role="tabpanel"
          aria-labelledby={chapter.id}
          style={{ "--feature": chapter.accent } as React.CSSProperties}
        >
          <div className="feature-copy">
            <p className="section-kicker">
              {chapter.num} / {chapter.zh.label}
            </p>
            <h3>{chapter.zh.title}</h3>
            <p>{chapter.zh.copy}</p>
            <details className="original-story">
              <summary>English story</summary>
              <p>
                {chapter.title} {chapter.copy}
              </p>
            </details>
            <button
              className="feature-tag"
              aria-label="EXPLORE DISTRICT"
              onClick={() => {
                setEntryView("district");
                enter();
              }}
            >
              探索这个街区 <ArrowUpRight size={14} />
            </button>
          </div>
          <span className="chapter-watermark" aria-hidden="true">
            {chapter.num}
          </span>
        </div>
      </section>
      <section className="stats-band">
        <div>
          <strong>4.7M</strong>
          <span>自主城市居民 / residents</span>
        </div>
        <div>
          <strong>0.00%</strong>
          <span>零碳街道 / carbon streets</span>
        </div>
        <div>
          <strong>24/7</strong>
          <span>全天城市感知 / city consciousness</span>
        </div>
        <div>
          <strong>∞</strong>
          <span>无限生活可能 / ways to belong</span>
        </div>
      </section>
      <section className="final-cta">
        <p className="section-kicker">THE NEXT WORLD IS WAITING</p>
        <h2>2050，城市与你相见。</h2>
        <a
          className="primary-cta"
          aria-label="REQUEST CITY ACCESS"
          href="mailto:hello@aicybercity2050.com?subject=City%20Access"
        >
          申请城市访问 <ArrowUpRight size={16} />
        </a>
        <footer>
          <span>© 2050 AI CYBER CITY</span>
          <span>AN EXPERIENCE BY FUTURE SYSTEMS</span>
          <span>BUILD 2050.04 · REALITY INDEX 99.8%</span>
          <span>
            STATUS: <b>ONLINE</b>
          </span>
        </footer>
      </section>
    </main>
  );
}
