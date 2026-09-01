'use client';

import { useEffect, useRef, useState } from 'react';
import Grainient from '@/app/(no-auth)/_components/grainient';

const features = [
  'Controle de entradas e saídas em tempo real',
  'Insights fortes e precisos para decidir com IA',
  'Relatórios detalhados e exportação de dados',
];

const PARALLAX_RANGE = 0.12;
const LERP_FACTOR = 0.06;

export default function AuthLeftPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const [center, setCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      setCenter((current) => {
        const dx = targetRef.current.x - current.x;
        const dy = targetRef.current.y - current.y;
        if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return current;
        return {
          x: current.x + dx * LERP_FACTOR,
          y: current.y + dy * LERP_FACTOR,
        };
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    targetRef.current = {
      x: relX * PARALLAX_RANGE,
      y: relY * PARALLAX_RANGE,
    };
  }

  function handleMouseLeave() {
    targetRef.current = { x: 0, y: 0 };
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative hidden overflow-hidden md:my-6 md:ml-6 md:mr-0 md:flex md:min-h-[calc(100vh-3rem)] md:self-center md:rounded-md"
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <Grainient
          color1="#E5E5E5"
          color2="#0A0A0A"
          color3="#525252"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={center.x}
          centerY={center.y}
          zoom={0.9}
        />
      </div>
      {/* Dark overlay for institutional weight */}
      <div className="absolute inset-0 bg-[#0a0a0a]/50" />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-16 py-10 text-white">
        {/* Main copy */}
        <div className="flex w-full max-w-lg flex-col items-center gap-10 text-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              Powered by AI
            </p>
            <h2 className="text-[2rem] font-semibold leading-[1.2] text-white">
              Gestão de estoque inteligente,
              <br />
              com decisões guiadas por IA.
            </h2>
          </div>

          {/* Feature list — indexed rows, no bubbles */}
          <div className="flex w-full flex-col border-t border-white/10">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center justify-center gap-5 border-b border-white/10 py-3.5"
              >
                <span className="w-6 shrink-0 text-right text-[10px] font-semibold tabular-nums tracking-widest text-white/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] font-medium text-white/60">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
