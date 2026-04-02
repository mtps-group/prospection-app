'use client';

import { useState, useRef, useCallback } from 'react';

export function Card3D({
  children,
  className = '',
  intensity = 8,
  style: externalStyle,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tiltTransform, setTiltTransform] = useState('');
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * -intensity;
    const rotY = (x - 0.5) * intensity;
    setTiltTransform(`perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`);
    setShine({ x: x * 100, y: y * 100, opacity: 0.1 });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setTiltTransform('perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    setShine({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...externalStyle,
        transform: tiltTransform || 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: tiltTransform ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Reflet lumineux */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl z-10"
        style={{
          background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,${shine.opacity * 2.2}) 0%, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}
