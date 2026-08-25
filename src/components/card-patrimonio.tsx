'use client';

// Card de uma unidade patrimonial individual — mesmo shell visual de
// `card-item-base.tsx` (usado por almoxarifado), pra manter as duas telas
// consistentes: bloco de ícone+título+subtítulo no header, métrica+status
// no footer. Não reaproveita `CardItemBase` porque o menu de ações dele é
// fixo (Editar/Emprestar/Excluir) e patrimônio precisa das sete ações
// condicionais de `PatrimonioLinhaAcoes` (compartilhadas com as regras de
// habilitação por status).

import { Package, MapPin } from 'lucide-react';
import StatusBadge from './status-badge';
import PatrimonioLinhaAcoes from './patrimonio-linha-acoes';
import type { AcaoPatrimonio, PatrimonioData } from '@/types/patrimonios';

interface CardPatrimonioProps {
  unidade: PatrimonioData;
  onClick: (unidade: PatrimonioData) => void;
  onAcao: (tipo: AcaoPatrimonio, unidade: PatrimonioData) => void;
  'data-test'?: string;
}

export default function CardPatrimonio({
  unidade,
  onClick,
  onAcao,
  'data-test': dataTest,
}: CardPatrimonioProps) {
  return (
    <div
      className="bg-card rounded-md border border-border p-4 transition-colors w-full h-full min-h-40 min-w-0 flex flex-col cursor-pointer relative"
      data-test={dataTest || `patrimonio-card-${unidade._id}`}
      title={`${unidade.numero_patrimonio} — ${unidade.item.nome}`}
      onClick={() => onClick(unidade)}
    >
      <div
        className="flex items-start justify-between mb-3 gap-2 overflow-hidden"
        data-test="header"
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden"
          data-test="component-info"
        >
          <div className="w-10 h-10 rounded-md flex items-center justify-center overflow-hidden shrink-0 bg-muted/40 border border-border/40">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden" data-test="text-info">
            <h3
              className="text-base font-semibold text-foreground leading-tight truncate"
              title={unidade.numero_patrimonio}
              data-test="patrimonio-card-numero"
            >
              {unidade.numero_patrimonio}
            </h3>
            <p
              className="text-sm font-medium tracking-[0.03em] text-muted-foreground truncate mt-0.5"
              title={unidade.item.nome}
              data-test="patrimonio-card-item-nome"
            >
              {unidade.item.nome}
            </p>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PatrimonioLinhaAcoes
            unidade={unidade}
            onAcao={onAcao}
            data-test="patrimonio-card-acoes-trigger"
          />
        </div>
      </div>

      <div className="mt-auto" style={{ minHeight: '44px' }}>
        <div
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-3 overflow-hidden"
          data-test="footer"
        >
          <div
            className="flex items-center gap-1 text-sm min-w-0 text-muted-foreground"
            data-test="patrimonio-card-localizacao"
            title={unidade.localizacao?.nome ?? undefined}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{unidade.localizacao?.nome ?? '—'}</span>
          </div>

          <StatusBadge status={unidade.status} data-test="patrimonio-card-status" />

          <div aria-hidden />
        </div>
      </div>
    </div>
  );
}
