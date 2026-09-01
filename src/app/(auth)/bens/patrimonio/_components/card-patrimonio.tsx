'use client';

// Card de uma unidade patrimonial individual — mesmo shell visual de
// `card-item-base.tsx` (usado por almoxarifado), pra manter as duas telas
// consistentes: bloco de ícone+título+subtítulo no header, métrica+status
// no footer. Não reaproveita `CardItemBase` porque o menu de ações dele é
// fixo (Editar/Emprestar/Excluir) e patrimônio precisa das sete ações
// condicionais de `PatrimonioLinhaAcoes` (compartilhadas com as regras de
// habilitação por status).

import { useMemo, useState } from 'react';
import { Package, MapPin } from 'lucide-react';
import StatusBadge from '@/components/comum/status-badge';
import PatrimonioLinhaAcoes from './patrimonio-linha-acoes';
import ModalVisualizarImagem from '@/components/comum/modal-visualizar-imagem';
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const imagemComTimestamp = useMemo(() => {
    if (!unidade.imagem) return undefined;
    const separator = unidade.imagem.includes('?') ? '&' : '?';
    return `${unidade.imagem}${separator}t=${Date.now()}`;
  }, [unidade.imagem]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagemComTimestamp) setIsImageModalOpen(true);
  };

  return (
    <div
      className="bg-card rounded-md border border-border p-4 transition-colors w-full h-full min-h-40 min-w-0 flex flex-col cursor-pointer relative"
      data-test={dataTest || `patrimonio-card-${unidade._id}`}
      title={`${unidade.modelo || unidade.categoria.nome} — ${unidade.numero_patrimonio}`}
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
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center overflow-hidden shrink-0 bg-muted/40 border border-border/40 ${
              imagemComTimestamp
                ? 'cursor-pointer hover:opacity-80 transition-opacity'
                : ''
            }`}
            data-test="component-icon"
            onClick={handleImageClick}
            title={
              imagemComTimestamp
                ? `Clique para ampliar a imagem de ${unidade.numero_patrimonio}`
                : ''
            }
          >
            {imagemComTimestamp ? (
              <img
                src={imagemComTimestamp}
                alt={unidade.numero_patrimonio}
                className="w-full h-full object-cover"
                title={`Imagem da unidade: ${unidade.numero_patrimonio}`}
              />
            ) : (
              <Package className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden" data-test="text-info">
            <h3
              className="text-base font-semibold text-foreground leading-tight truncate"
              title={unidade.modelo || unidade.categoria.nome}
              data-test="patrimonio-card-modelo"
            >
              {unidade.modelo || unidade.categoria.nome}
            </h3>
            <p
              className="text-sm font-medium tracking-[0.03em] text-muted-foreground truncate mt-0.5"
              title={unidade.numero_patrimonio}
              data-test="patrimonio-card-numero"
            >
              {unidade.numero_patrimonio}
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

          <StatusBadge
            status={unidade.status}
            data-test="patrimonio-card-status"
          />

          <div aria-hidden />
        </div>
      </div>

      {imagemComTimestamp && (
        <ModalVisualizarImagem
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imagemUrl={imagemComTimestamp}
          nomeItem={unidade.numero_patrimonio}
        />
      )}
    </div>
  );
}
