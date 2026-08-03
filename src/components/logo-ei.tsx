type LogoEiProps = {
  logoSizeClassName?: string;
};

export default function LogoEi({ logoSizeClassName = 'w-44' }: LogoEiProps) {
  return (
    <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-[#1a1a1a] via-[#121212] to-[#0f0f0f]  items-center justify-center overflow-hidden">
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
        <img
          className={logoSizeClassName}
          src="/estoque-inteligente-logo.png"
          alt="Estoque Inteligente"
        />
      </div>
    </div>
  );
}
