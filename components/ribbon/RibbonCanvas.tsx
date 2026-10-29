"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type RibbonHandle = {
  // Sequence progress: 0 = loose loop, ~0.3 = finished S, 1 = end of the first turn.
  setProgress: (progress: number) => void;
};

type Props = {
  ref?: Ref<RibbonHandle>;
  className?: string;
  // Plays the endless rest-and-turn loop on its own clock instead of scroll.
  autoplay?: boolean;
  initialProgress?: number;
  // The poster is the finished S; turn it off where the ribbon starts as a loop.
  poster?: boolean;
  onReady?: () => void;
};

// Renders the approved glass ribbon (lib/ribbon, ported from the serial repo)
// only when its progress changes, so a still page costs no frames.
export function RibbonCanvas({
  ref,
  className = "",
  autoplay = false,
  initialProgress = 0,
  poster = true,
  onReady,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const progress = useRef(initialProgress);
  const render = useRef<() => void>(() => {});
  const readyCallback = useRef(onReady);
  useEffect(() => {
    readyCallback.current = onReady;
  });

  useImperativeHandle(ref, () => ({
    setProgress(value) {
      if (value === progress.current) return;
      progress.current = value;
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
      const camera = new THREE.OrthographicCamera(-1.54, 1.54, 1.54, -1.54, 0.1, 30);
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
      const model = createSequence({ material: createGlassMaterial(THREE) });
      scene.add(model.group);

      let frame = 0;
      let visible = true;
      let lost = false;
      let elapsed = initialProgress * SEQUENCE_DURATION;
      let last = performance.now();
      let ready = false;

      const draw = (now: number) => {
        frame = 0;
        if (disposed || lost || !visible || document.hidden) return;
        if (autoplay) {
          elapsed += Math.min(0.05, (now - last) / 1000);
          last = now;
          progress.current = elapsed / SEQUENCE_DURATION;
        }
        model.update(progress.current);
        renderer.render(scene, camera);
        if (!ready) {
          ready = true;
          el.classList.add("is-ready");
          readyCallback.current?.();
        }
        if (autoplay) schedule();
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(draw);
      };
      render.current = schedule;

      const resize = () => {
        const { width, height } = el.getBoundingClientRect();
        const w = Math.max(1, width);
        const h = Math.max(1, height);
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2, 2048 / Math.max(w, h)));
        renderer.setSize(w, h, false);
        camera.left = (-1.54 * w) / h;
        camera.right = (1.54 * w) / h;
        camera.updateProjectionMatrix();
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
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(el);
      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        last = performance.now();
        if (visible) schedule();
      });
      intersection.observe(el);
      document.addEventListener("visibilitychange", onVisibility);
      canvas.current.addEventListener("webglcontextlost", onLost);
      canvas.current.addEventListener("webglcontextrestored", onRestored);
      const canvasEl = canvas.current;
      resize();

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        intersection.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        canvasEl.removeEventListener("webglcontextlost", onLost);
        canvasEl.removeEventListener("webglcontextrestored", onRestored);
        model.dispose();
        environment.dispose();
        renderer.dispose();
        render.current = () => {};
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [autoplay, initialProgress]);

  return (
    <div ref={holder} className={`ribbon relative ${className}`}>
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
