"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type RibbonHandle = {
  // Sequence progress: 0 = loose loop, ~0.3 = finished S, 1 = end of the first turn.
  setProgress: (progress: number) => void;
  // Orthographic zoom toward a point in ribbon space (1 = framed as usual).
  setCamera: (zoom: number, x: number, y: number) => void;
};

type Props = {
  ref?: Ref<RibbonHandle>;
  className?: string;
  // Plays the endless rest-and-turn loop on its own clock instead of scroll.
  autoplay?: boolean;
  initialProgress?: number;
  // The poster is the finished S; turn it off where the ribbon starts as a loop.
  poster?: boolean;
  // "glass" is the clear study material; "satin" is the black logo finish.
  material?: "glass" | "satin";
  // The ribbon leans a little toward the pointer.
  interactive?: boolean;
  // Size in px of the square the ribbon is framed in; defaults to the canvas's
  // shorter side. A full-screen canvas can keep the ribbon at a set size.
  frame?: (width: number, height: number) => number;
  onReady?: () => void;
};

const HALF = 1.54; // half-height of the ribbon frame in world units (serial repo)
const TILT_X = 0.16;
const TILT_Y = 0.22;

// Renders the approved ribbon (lib/ribbon, ported from the serial repo) only
// when something changes, so a still page costs no frames.
export function RibbonCanvas({
  ref,
  className = "",
  autoplay = false,
  initialProgress = 0,
  poster = true,
  material = "glass",
  interactive = false,
  frame,
  onReady,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const progress = useRef(initialProgress);
  const view = useRef({ zoom: 1, x: 0, y: 0 });
  const render = useRef<() => void>(() => {});
  const readyCallback = useRef(onReady);
  const frameRef = useRef(frame);
  useEffect(() => {
    readyCallback.current = onReady;
    frameRef.current = frame;
  });

  useImperativeHandle(ref, () => ({
    setProgress(value) {
      if (value === progress.current) return;
      progress.current = value;
      render.current();
    },
    setCamera(zoom, x, y) {
      const v = view.current;
      if (v.zoom === zoom && v.x === x && v.y === y) return;
      view.current = { zoom, x, y };
      render.current();
    },
  }));

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [THREE, { createSequence, SEQUENCE_DURATION }, { createGlassMaterial, createGlassEnvironment }] =
        await Promise.all([import("three"), import("@/lib/ribbon/sequence.js"), import("@/lib/ribbon/glass.js")]);
      if (disposed || !holder.current || !canvas.current) return;
      const el = holder.current;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true });
      } catch {
        readyCallback.current?.();
        return;
      }
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.transmissionResolutionScale = 0.5;

      const scene = new THREE.Scene();
      let environment = createGlassEnvironment(THREE, renderer);
      scene.environment = environment.texture;
      const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 30);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xb5bac5, 0.8));
      for (const [intensity, [x, y, z]] of [
        [1.1, [-3, 4, 6]],
        [0.45, [4, -2, 4]],
        [0.6, [-4, -1, -3]],
      ] as const) {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(x, y, z);
        scene.add(light);
      }
      // Satin black matches the GLB in the serial repo ("Satin black", metalness
      // 0.12, roughness 0.38) with a light clearcoat for the logo's sheen.
      const surface =
        material === "satin"
          ? new THREE.MeshPhysicalMaterial({
              color: 0x111111,
              metalness: 0.12,
              roughness: 0.38,
              clearcoat: 0.5,
              clearcoatRoughness: 0.3,
            })
          : createGlassMaterial(THREE);
      const model = createSequence({ material: surface });
      // The sequence owns model.group's rotation; the pointer tilt lives on a parent.
      const pivot = new THREE.Group();
      pivot.add(model.group);
      scene.add(pivot);

      let raf = 0;
      let visible = true;
      let lost = false;
      let elapsed = initialProgress * SEQUENCE_DURATION;
      let last = performance.now();
      let ready = false;
      let half = HALF;
      let aspect = 1;
      const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

      const draw = (now: number) => {
        raf = 0;
        if (disposed || lost || !visible || document.hidden) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (autoplay) {
          elapsed += dt;
          progress.current = elapsed / SEQUENCE_DURATION;
        }
        // Ease the tilt toward the pointer; keep drawing until it settles.
        const k = 1 - Math.exp(-dt * 4);
        tilt.x += (tilt.tx - tilt.x) * k;
        tilt.y += (tilt.ty - tilt.y) * k;
        const settling = Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.0005;
        const { zoom, x, y } = view.current;
        // Tilt fades as the camera zooms in, so the zoom target never slides away.
        pivot.rotation.set(tilt.x / zoom, tilt.y / zoom, 0);

        camera.zoom = zoom;
        camera.position.set(x, y, 6);
        camera.left = -half * aspect;
        camera.right = half * aspect;
        camera.top = half;
        camera.bottom = -half;
        camera.updateProjectionMatrix();

        model.update(progress.current);
        renderer.render(scene, camera);
        if (!ready) {
          ready = true;
          el.classList.add("is-ready");
          readyCallback.current?.();
        }
        if (autoplay || settling) schedule();
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(draw);
      };
      render.current = schedule;

      const resize = () => {
        const { width, height } = el.getBoundingClientRect();
        const w = Math.max(1, width);
        const h = Math.max(1, height);
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2, 2560 / Math.max(w, h)));
        renderer.setSize(w, h, false);
        const box = frameRef.current?.(w, h) ?? Math.min(w, h);
        half = (HALF * h) / box;
        aspect = w / h;
        last = performance.now();
        schedule();
      };
      const onPointer = (event: PointerEvent) => {
        // Hold still during the intro, where the loader's oval must match the loop.
        if (event.pointerType === "touch" || document.documentElement.classList.contains("is-intro")) return;
        tilt.ty = ((event.clientX / innerWidth) * 2 - 1) * TILT_Y;
        tilt.tx = ((event.clientY / innerHeight) * 2 - 1) * TILT_X;
        last = performance.now();
        schedule();
      };
      const onVisibility = () => {
        last = performance.now();
        schedule();
      };
      const onLost = (event: Event) => {
        event.preventDefault();
        lost = true;
      };
      const onRestored = () => {
        environment.dispose();
        environment = createGlassEnvironment(THREE, renderer);
        scene.environment = environment.texture;
        lost = false;
        schedule();
      };
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(el);
      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        last = performance.now();
        if (visible) schedule();
      });
      intersection.observe(el);
      document.addEventListener("visibilitychange", onVisibility);
      if (interactive && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });
      const canvasEl = canvas.current;
      canvasEl.addEventListener("webglcontextlost", onLost);
      canvasEl.addEventListener("webglcontextrestored", onRestored);
      resize();

      cleanup = () => {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersection.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pointermove", onPointer);
        canvasEl.removeEventListener("webglcontextlost", onLost);
        canvasEl.removeEventListener("webglcontextrestored", onRestored);
        model.dispose();
        if (material === "satin") surface.dispose();
        environment.dispose();
        renderer.dispose();
        render.current = () => {};
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [autoplay, initialProgress, material, interactive]);

  return (
    <div ref={holder} className={`ribbon ${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} ${className}`}>
      {/* The pre-rendered S stands in until WebGL has drawn its first frame. */}
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/ribbon/poster.png"
          alt=""
          aria-hidden="true"
          className="ribbon__poster absolute inset-0 h-full w-full object-contain"
        />
      ) : null}
      <canvas ref={canvas} className="ribbon__canvas absolute inset-0 h-full w-full" />
    </div>
  );
}
