const features = [
  'Controle de entradas e saídas em tempo real',
  'Insights fortes e precisos para decidir com IA',
  'Relatórios detalhados e exportação de dados',
];

export default function AuthLeftPanel() {
  return (
    <div className="relative hidden overflow-hidden md:my-6 md:ml-6 md:mr-0 md:flex md:min-h-[calc(100vh-3rem)] md:self-center md:rounded-2xl">
      {/* Background image */}
      <img
        src="/aurora-gradient-1774906689788.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover scale-150"
        style={{
          transformOrigin: 'center center',
          filter: 'contrast(1.1) brightness(0.75) saturate(0.55)',
        }}
      />
      {/* Dark overlay for institutional weight */}
      <div className="absolute inset-0 bg-[#0b0f14]/50" />

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
