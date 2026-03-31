export default function AuthLeftPanel() {
  return (
    <div className="relative hidden overflow-hidden md:my-6 md:ml-6 md:mr-0 md:flex md:min-h-[calc(100vh-3rem)] md:self-center md:rounded-[28px]">
      {/* Imagem de fundo com zoom responsivo */}
      <img
        src="/aurora-gradient-1774906689788.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover scale-150"
        style={{ transformOrigin: 'center center', filter: 'contrast(1.2) brightness(0.90) saturate(0.7)' }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center p-10 text-white gap-8">
        {/* Tagline */}
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium tracking-widest text-white/50">Powered by AI</p>
          <h2 className="text-3xl font-semibold leading-tight text-white">
            Gestão de estoque inteligente,<br />com decisões guiadas por IA.
          </h2>
        </div>

        {/* Feature cards */}
        <div className="flex flex-col gap-2.5 w-fit">
          <div className="group flex items-center gap-4 rounded-2xl bg-white/8 backdrop-blur-sm px-5 py-3 transition-all duration-300 hover:bg-white/15 cursor-default">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#1d3a72]">1</span>
            <span className="text-sm font-medium text-white/70 whitespace-nowrap transition-all duration-300 group-hover:text-white">Controle de entradas e saídas em tempo real</span>
          </div>
          <div className="group flex items-center gap-4 rounded-2xl bg-white/8 backdrop-blur-sm px-5 py-3 transition-all duration-300 hover:bg-white/15 cursor-default">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#1d3a72]">2</span>
            <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">Insights e alertas gerados por inteligência artificial</span>
          </div>
          <div className="group flex items-center gap-4 rounded-2xl bg-white/8 backdrop-blur-sm px-5 py-3 transition-all duration-300 hover:bg-white/15 cursor-default">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#1d3a72]">3</span>
            <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">Relatórios detalhados e exportação de dados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
