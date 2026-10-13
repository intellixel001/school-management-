'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/gsap';

export default function WarpField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;
    let animationFrameId: number;
    let mounted = true;
    let isHidden = false;

    // Reduced motion static field
    const isReduced = prefersReducedMotion();
    const NUM_STARS = isReduced ? 200 : 400;

    interface Star {
      x: number;
      y: number;
      z: number;
      prevScreenX: number | null;
      prevScreenY: number | null;
    }

    let stars: Star[] = [];

    const initStars = () => {
      stars = Array.from({ length: NUM_STARS }).map(() => ({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: isReduced ? Math.random() : Math.random() + 0.01,
        prevScreenX: null,
        prevScreenY: null,
      }));
    };

    const resize = () => {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Reset star prev coords on resize
      stars.forEach(star => {
        star.prevScreenX = null;
        star.prevScreenY = null;
      });

      if (isReduced) {
        drawStatic();
      }
    };

    const drawStatic = () => {
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        const screenX = (star.x / star.z) * (width / 2) + (width / 2);
        const screenY = (star.y / star.z) * (height / 2) + (height / 2);
        
        ctx.fillStyle = `rgba(190, 230, 255, ${0.1 + (1 - star.z) * 0.4})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, (1 - star.z) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    let startMs = 0;
    let accelStartMs = 0;

    const render = (time: number) => {
      if (!mounted) return;
      if (isHidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      if (!startMs) startMs = time;

      // Pulse logic: every 8s, ramp from 0.005 to 0.008 over 1s, back to 0.005 over 1s.
      const cycleMs = (time - startMs) % 8000;
      let speed = 0.005;
      
      // Override with acceleration event
      if (accelStartMs && time - accelStartMs < 600) {
        const elapsed = time - accelStartMs;
        if (elapsed < 300) {
          // ramp up to 0.018 over 300ms
          speed = 0.005 + 0.013 * (elapsed / 300);
        } else {
          // ramp back to 0.005 over 300ms
          speed = 0.018 - 0.013 * ((elapsed - 300) / 300);
        }
      } else {
        if (cycleMs > 7000) { // ramp down
          speed = 0.008 - 0.003 * ((cycleMs - 7000) / 1000);
        } else if (cycleMs > 6000) { // ramp up
          speed = 0.005 + 0.003 * ((cycleMs - 6000) / 1000);
        }
      }

      ctx.fillStyle = 'rgba(6, 8, 20, 0.35)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.z -= speed;

        if (star.z <= 0.01) {
          star.x = (Math.random() - 0.5) * 2;
          star.y = (Math.random() - 0.5) * 2;
          star.z = 1;
          star.prevScreenX = null;
          star.prevScreenY = null;
          continue;
        }

        const screenX = (star.x / star.z) * cx + cx;
        const screenY = (star.y / star.z) * cy + cy;

        if (star.prevScreenX !== null && star.prevScreenY !== null) {
          ctx.beginPath();
          ctx.moveTo(star.prevScreenX, star.prevScreenY);
          ctx.lineTo(screenX, screenY);
          ctx.lineWidth = (1 - star.z) * 2.5;
          ctx.strokeStyle = `rgba(190, 230, 255, ${1 - star.z})`;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        star.prevScreenX = screenX;
        star.prevScreenY = screenY;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      isHidden = document.hidden;
    };

    const handleAccelerate = () => {
      accelStartMs = performance.now();
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('menu:transition-accelerate', handleAccelerate);

    initStars();
    resize();

    if (!isReduced) {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      mounted = false;
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('menu:transition-accelerate', handleAccelerate);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="warp-field"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
