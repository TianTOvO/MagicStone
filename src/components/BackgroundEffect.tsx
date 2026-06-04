import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  shape: 'circle' | 'triangle' | 'diamond';
  rotation: number;
  rotationSpeed: number;
}

const PARTICLE_COUNT = 100;
const CONNECTION_DIST = 180;
const MOUSE_ATTRACT_RADIUS = 220;
const MOUSE_ATTRACT_FORCE = 0.04;
const SHOCKWAVE_RADIUS = 120;
const SHOCKWAVE_FORCE = 0.05;
const SHOCKWAVE_DURATION = 800; // ms

export default function BackgroundEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const shockwaveRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const shapes = ['circle', 'triangle', 'diamond'] as const;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: 5 + Math.random() * 5,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      });
    }
    particlesRef.current = particles;

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Double-click shockwave
    const onDblClick = (e: MouseEvent) => {
      shockwaveRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    };
    window.addEventListener('dblclick', onDblClick);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;
      const mouseActive = mx > 0 && my > 0;
      const now = performance.now();
      const shockwave = shockwaveRef.current;
      const shockElapsed = now - shockwave.time;
      const shockActive = shockElapsed < SHOCKWAVE_DURATION;

      // Draw shockwave ring
      if (shockActive && shockwave.time > 0) {
        const progress = shockElapsed / SHOCKWAVE_DURATION;
        const ringRadius = progress * SHOCKWAVE_RADIUS;
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96, 165, 250, ${0.5 * (1 - progress)})`; // light blue, fading
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Update & draw particles
      for (const p of particles) {
        // Shockwave repulsion (overrides mouse attraction)
        if (shockActive && shockwave.time > 0) {
          const sdx = p.x - shockwave.x;
          const sdy = p.y - shockwave.y;
          const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sdist < SHOCKWAVE_RADIUS && sdist > 1) {
            const force = (1 - shockElapsed / SHOCKWAVE_DURATION) * (1 - sdist / SHOCKWAVE_RADIUS);
            p.vx += (sdx / sdist) * force * SHOCKWAVE_FORCE;
            p.vy += (sdy / sdist) * force * SHOCKWAVE_FORCE;
          }
        } else if (mouseActive) {
          // Mouse attraction (only when no active shockwave)
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_ATTRACT_RADIUS && dist > 0) {
            const force = (MOUSE_ATTRACT_RADIUS - dist) / MOUSE_ATTRACT_RADIUS;
            p.vx += (dx / dist) * force * MOUSE_ATTRACT_FORCE;
            p.vy += (dy / dist) * force * MOUSE_ATTRACT_FORCE;
          }
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Wrap around edges
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        // Draw shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = 'rgba(147, 51, 234, 0.25)'; // purple
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; // blue
        ctx.lineWidth = 1;

        const s = p.size;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, s, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.866, s * 0.5);
          ctx.lineTo(-s * 0.866, s * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.7, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.5;
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`; // indigo
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Mouse connection lines — only when mouse is active AND no shockwave
      if (mouseActive && !shockActive) {
        for (const p of particles) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.45;
            // Glow layer
            ctx.strokeStyle = `rgba(245, 158, 11, ${opacity * 0.3})`; // amber glow
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            // Core line
            ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`; // amber
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  return (
    <>
      {/* Static decorative shapes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[8%] left-[5%] w-40 h-40 bg-purple-300 rounded-full opacity-[0.07]" />
        <div className="absolute top-[15%] right-[10%] w-56 h-56 bg-blue-300 opacity-[0.06]"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute top-[60%] left-[12%] w-32 h-32 bg-indigo-300 opacity-[0.07]"
          style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
        <div className="absolute top-[40%] right-[8%] w-48 h-48 bg-violet-300 rounded-full opacity-[0.06]" />
        <div className="absolute bottom-[20%] left-[35%] w-36 h-36 bg-blue-300 opacity-[0.07]"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute top-[75%] right-[25%] w-44 h-44 bg-purple-300 rounded-full opacity-[0.06]" />
        <div className="absolute top-[5%] left-[45%] w-28 h-28 bg-indigo-300 opacity-[0.07]"
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-52 h-52 bg-violet-300 opacity-[0.06]"
          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>

      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: 0.85 }}
      />
    </>
  );
}
