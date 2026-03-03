import React, { useEffect, useRef } from 'react';

// Simple 3D floating shapes using canvas
export const Floating3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const shapes = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 40 + Math.random() * 60,
      dx: 0.2 + Math.random() * 0.4,
      dy: 0.2 + Math.random() * 0.4,
      color: i % 2 === 0 ? '#00f6ff' : '#ff00c8',
      opacity: 0.18 + Math.random() * 0.12,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      shapes.forEach((s) => {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 32;
        ctx.fill();
        ctx.restore();
      });
    }

    function animate() {
      shapes.forEach((s) => {
        s.x += Math.sin(Date.now() / 1000 + s.r) * s.dx;
        s.y += Math.cos(Date.now() / 1000 + s.r) * s.dy;
        // Parallax effect on mouse move
      });
      draw();
      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    });

    return () => {
      window.removeEventListener('resize', () => {});
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
