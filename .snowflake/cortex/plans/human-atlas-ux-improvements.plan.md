# Plan: Human Atlas UX Improvements

## Context

The Human Atlas is a React + Three.js SPA serving 2,234 anatomical meshes. The main files involved:

- [app/scene.tsx](app/scene.tsx) — Three.js renderer, OrbitControls, selection shader, animation loop
- [app/page.tsx](app/page.tsx) — React UI: panels, slider, buttons, state management
- [app/globals.css](app/globals.css) — All styling including responsive breakpoints

Key findings from code review:
- **OrbitControls** (line 23 of scene.tsx): already configured with damping, min/max distance. Currently uses default zoom behavior (zoom to center).
- **Selection highlight** (line 57 of scene.tsx): already mixes a teal color (`vec3(0.42, 0.85, 0.78)`) at 75% when `partSelected > 0`. No animation/glow.
- **Explode slider** (line 45 of page.tsx): `<Slider>` from 0-100 with labels "Assembled" / "Every piece". No playback controls.
- **Scene background** (line 20 of scene.tsx): hardcoded `renderer.setClearColor('#f2f3f3')`.
- **Systems panel** (CSS): positioned `top:200px` on desktop, scrolls internally.
- **Search panel** (CSS): `width:320px` on desktop.

---

## 1. Cursor-targeted zoom and middle-mouse pan

**File:** [app/scene.tsx](app/scene.tsx), line 23

OrbitControls already supports cursor-targeted zoom via the `zoomToCursor` property (added in Three.js r149, we're on r159). Middle-mouse pan is also a built-in mapping.

```ts
// After existing controls config (line 23):
controls.zoomToCursor = true;
controls.mouseButtons = {
  LEFT: T.MOUSE.ROTATE,
  MIDDLE: T.MOUSE.PAN,   // middle-click to pan
  RIGHT: T.MOUSE.DOLLY,  // right-click to zoom (keep existing)
};
```

Note: Line 126 already dynamically sets `controls.mouseButtons.LEFT` based on explode amount. We need to preserve that logic while adding the MIDDLE button. The fix is to set the initial config to include MIDDLE, and only override LEFT in the animation loop (which already happens).

---

## 2. Explode playback controls and visible scrubber

**Files:** [app/page.tsx](app/page.tsx) line 45, [app/globals.css](app/globals.css)

Add state for playback direction and an animation interval:
```tsx
const [playing, setPlaying] = useState<'forward'|'reverse'|null>(null);
```

Use `useEffect` to animate `state.explode` when playing:
```tsx
useEffect(() => {
  if (!playing) return;
  const id = setInterval(() => {
    setState(s => {
      const next = s.explode + (playing === 'forward' ? 0.008 : -0.008);
      if (next >= 1 || next <= 0) { setPlaying(null); return { ...s, explode: Math.max(0, Math.min(1, next)) }; }
      return { ...s, explode: next };
    });
  }, 16);
  return () => clearInterval(id);
}, [playing]);
```

UI in the bottom dock: add Play/Reverse buttons flanking the slider, using Lucide icons `Play`, `Rewind` (or `SkipBack`). Clicking toggles playback; clicking again pauses.

**Slider visibility:** increase the track height, add a more visible background color, and make the thumb larger:
```css
.explode-control [data-slot=slider-track] {
  height: 6px;
  background: #c8d0d8;
  border-radius: 4px;
}
.explode-control [data-slot=slider-range] {
  background: #536875;
  border-radius: 4px;
}
```

---

## 3. Dark/light mode toggle

**Files:** [app/page.tsx](app/page.tsx) line 35, [app/globals.css](app/globals.css), [app/scene.tsx](app/scene.tsx)

Add React state and pass to the scene:
```tsx
const [dark, setDark] = useState(false);
```

Toggle in `<nav className="top-actions">` using Lucide `Moon`/`Sun` icons. Apply `className={dark ? 'dark' : ''}` on `<main>`.

**CSS dark theme** using `.dark` class selector on `:root` or `.studio`:
```css
.studio.dark {
  --background: #151a1e;
  --foreground: #e0e4e8;
  --card: #1e2429;
  --border: #e0e4e818;
  --muted: #2a3138;
  --muted-foreground: #8a949e;
  color: #e0e4e8;
}
.studio.dark .glass {
  background: #1e2429eb;
  border-color: #e0e4e812;
}
/* ... additional overrides for text, hover tooltip, buttons, etc. */
```

**Scene background:** Pass `dark` state into `AnatomyScene` props. In scene.tsx, update `renderer.setClearColor` reactively:
```ts
// In the animation loop or via a ref:
renderer.setClearColor(dark ? '#151a1e' : '#f2f3f3');
ground.material.color.set(dark ? 0x252c33 : 0xd5d9dc);
platform.material.color.set(dark ? 0x2a3239 : 0xeeeeec);
```

---

## 4. Taller systems panel

**File:** [app/globals.css](app/globals.css)

The systems panel uses `top:200px` (line 34 area). The detail sheet uses `top:120px; bottom:175px`. Align the systems panel to match:

```css
.layers-panel {
  top: 200px;
  bottom: 175px;  /* match detail-sheet bottom positioning */
}
```

This gives both panels the same vertical extent. The `.system-list` already has `overflow-y: auto`, so the list will fill the available space without needing a scrollbar for most screen heights.

---

## 5. Wider search box

**File:** [app/globals.css](app/globals.css)

The search panel is currently `width:320px`. Increase by 30%:

```css
.search-panel { width: 416px; }
```

Also update the 1000px breakpoint where it gets narrower. Mobile breakpoint (`max-width:767px`) already uses `left:12px;right:12px;width:auto` so no change needed there.

---

## 6. Selection glow with fade pulse

**File:** [app/scene.tsx](app/scene.tsx), lines 51-58

Add a `time` uniform to the shader and use it to create a pulsing emissive effect on selected parts.

In `materialFor()`:
```glsl
// Add to uniforms:
shader.uniforms.uTime = { value: 0 };

// Replace the existing selection color mix (line 57) with:
float pulse = 0.55 + 0.45 * sin(uTime * 3.0);
float glow = partSelected * pulse;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.85, 0.78), glow * 0.75);

// Add emissive contribution for the glow:
// (in the output_fragment or emissivemap_fragment section)
outgoingLight += vec3(0.25, 0.65, 0.60) * partSelected * pulse * 0.3;
```

In the animation loop, update `uTime` each frame:
```ts
materials.forEach(m => {
  if ((m as any).userData?.shader) {
    (m as any).userData.shader.uniforms.uTime.value = clock.getElapsedTime();
  }
});
```

Store the shader reference in `onBeforeCompile` via `m.userData.shader = shader`.

This creates a breathing glow that subtly fades in and out, clearly distinguishing the selected structure.

---

## Critical Files

- `app/scene.tsx` — Zoom/pan controls (task 1), selection glow shader (task 6), dark mode scene colors (task 3)
- `app/page.tsx` — Explode playback state/UI (task 2), dark mode toggle (task 3)
- `app/globals.css` — Slider visibility (task 2), dark theme CSS (task 3), panel height (task 4), search width (task 5)

## Verification

1. Open the app locally (`npm run dev`) and verify:
   - Scroll wheel zooms toward cursor position, not screen center
   - Middle-mouse button pans the view
   - Forward/Reverse play buttons animate the explode slider smoothly
   - Slider track is visually prominent
   - Dark/Light toggle switches all surfaces, text, and 3D background
   - Systems panel extends to match detail sheet height
   - Search panel is noticeably wider
   - Selected structure pulses with a subtle glow
2. Run `npm run check` (TypeScript check)
3. Run `npm run build` to confirm production build succeeds
