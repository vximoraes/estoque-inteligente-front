export default function LogoEi() {
  return (
    <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-[#151c25] via-[#0f1419] to-[#0e1318]  items-center justify-center overflow-hidden">
      {/* Grid mais contrastado */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Logo com tamanho reduzido */}
      <div className="relative z-10">
        <img className="w-44" src="ei.png" alt="Estoque Inteligente" />
      </div>
    </div>
  );
}
