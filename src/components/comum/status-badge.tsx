// Badge de status compartilhado por Item (Em Estoque/Baixo Estoque/
// Indisponível) e por unidade de Patrimônio (Disponível/Emprestado/
// Manutenção/Baixado). Extraído de `item-estoque.tsx` e
// `relatorios/itens/page.tsx`, que tinham a mesma lógica de cor duplicada.
//
// O tema só define 3 pares de cor (--status-success/warning/danger-bg/text).
// Mapeamento para os status de patrimônio, sem cor nova:
// - Disponível -> success (pronto para uso, equivalente a "Em Estoque").
// - Emprestado -> warning (fora de mãos agora, mas é estado normal/
//   transitório, não um problema).
// - Manutenção -> warning (mesma leitura: temporariamente indisponível,
//   sem ser uma falha do sistema).
// - Baixado -> usa os tokens neutros `--muted`/`--muted-foreground` em vez
//   de danger: é um estado terminal esperado (fim de vida útil), não um
//   erro a ser corrigido.

const STATUS_BG: Record<string, string> = {
  'Em Estoque': 'var(--status-success-bg)',
  Disponível: 'var(--status-success-bg)',
  'Baixo Estoque': 'var(--status-warning-bg)',
  Emprestado: 'var(--status-warning-bg)',
  Manutenção: 'var(--status-warning-bg)',
  Indisponível: 'var(--status-danger-bg)',
  Baixado: 'var(--muted)',
};

const STATUS_TEXT: Record<string, string> = {
  'Em Estoque': 'var(--status-success-text)',
  Disponível: 'var(--status-success-text)',
  'Baixo Estoque': 'var(--status-warning-text)',
  Emprestado: 'var(--status-warning-text)',
  Manutenção: 'var(--status-warning-text)',
  Indisponível: 'var(--status-danger-text)',
  Baixado: 'var(--muted-foreground)',
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
  'data-test'?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
};

export default function StatusBadge({
  status,
  size = 'md',
  className = '',
  'data-test': dataTest,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border border-current/30 font-medium truncate max-w-full ${SIZE_CLASSES[size]} ${className}`}
      title={`Status atual: ${status}`}
      data-test={dataTest || 'status-badge'}
      style={{
        color: STATUS_TEXT[status] || 'var(--muted-foreground)',
        backgroundColor: STATUS_BG[status] || 'var(--muted)',
      }}
    >
      {status}
    </span>
  );
}
