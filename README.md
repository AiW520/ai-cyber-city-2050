# 2050 AI Cyber City

A Next.js static site with the original city story and an on-demand Three.js city explorer.

## Run

```sh
npm ci
npm run dev -- --port 4311
npm run typecheck
npm run build
```

`build` exports the site to `out/`. Production assets use the existing GitHub Pages base path `/ai-cyber-city-2050/`. Serve `out/` at that path when testing production; `next start` does not serve a static export. The existing Pages workflow builds and deploys this directory.

## City Explorer

The homepage uses WebP captures of the actual procedural city (approximately 63 kB desktop and 17 kB mobile). Three.js and React Three Fiber load after entering the experience. No external model, texture, API key or generated artwork is required.

Four districts share their selection with the original chapter panel. Chinese labels are primary; the original English story is available in an expandable section. The scene has clickable district markers, walking service androids, moving autonomous cars, an elevated rail train, a flying shuttle, adaptive towers, solar panels, a greenhouse and public gardens. Distinct landmarks include a vaulted civic hall, a terraced green-roof building and a moving wind crown.

- Desktop: drag to orbit, wheel to zoom. Mobile defaults to page scrolling over the Canvas. Switch the pointer/hand control to camera mode for one-finger orbit and two-finger zoom/pan, then switch back to scroll mode.
- On the focused scene, Left/Right rotate, +/- zoom, Space pauses and Escape returns to the story. All commands also have visible controls.
- Overview, district and street cameras, day/night lighting, fullscreen and a timed district tour are available.
- Auto quality selects Eco for small screens, low-memory devices, limited CPU cores or data-saving preferences. Sustained frame rates below 24 FPS switch Auto to Eco.
- Eco uses 1x DPR, disables shadows, reduces peripheral towers and omits the shuttle. High is capped at 1.6x DPR. Building windows use instancing.
- Motion pauses offscreen and when the page is hidden. Manual pause and reduced-motion preferences use demand rendering; camera controls remain available.
- WebGL initialization errors and context loss preserve a static preview, all chapter content and district selectors, with a retry action.
- Search accepts Chinese and English district names. A no-results state offers a clear-search command. District details and mobile camera settings expand in normal document flow outside the Canvas. Mobile HUD tools are collapsible, and a visible return-to-story command remains available.

The story text, conceptual statistics and request-access mail link are preserved. The city is an illustrative scene, not live telemetry or a physics simulation.

## Structure

- `components/city-data.ts`: existing chapter copy and shared district metadata.
- `components/CityExplorer.tsx`: lazy loading, controls, quality policy, accessibility and fallback.
- `components/CityScene.tsx`: procedural geometry, animation, hotspot raycasting and camera rig.
- `components/FutureExperience.tsx`: homepage story and chapter navigation.
- `public/city-preview.webp`: preview captured from this scene.

## Validation

TypeScript and production export pass. Chrome/Playwright checks cover the production Pages subpath at 1440x900, 390x844 and 360x800, lazy loading, rendered Canvas pixels, raycast selection, camera/zoom/lighting, pause/resume, tour, quality, fullscreen, touch and keyboard controls, navigation, focus restoration, search/empty state, detail/settings expansion, scroll versus camera gestures, context loss/retry, WebGL-disabled fallback and reduced motion. Browser validation used Chrome with software WebGL; physical mobile GPUs and Safari still require device testing.

The baseline repository has no test script. The task's browser verification script and screenshots are supplied with the implementation report.
