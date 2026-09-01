'use client';
import React, { useState } from 'react';
import { Package } from 'lucide-react';
import ModalVisualizarImagem from '@/components/comum/modal-visualizar-imagem';
import StatusBadge from '@/components/comum/status-badge';
import ItemConsumoLinhaAcoes from './item-consumo-linha-acoes';

export interface CardItemBaseProps {
  id?: string;
  nome: string;
  categoria: string;
  status: string;
  imagem?: string;
  titulo: string;
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onEmprestar?: (id: string) => void;
  emprestarDesabilitado?: boolean;
  emprestarTitle?: string;
  /** Bloco à esquerda do footer — Qtd/Mín (consumo) ou Unid/Disp (patrimônio). */
  metricas: React.ReactNode;
  /** Ícones à direita do badge de status; omitido, o footer não reserva espaço para eles. */
  acoesRapidas?: React.ReactNode;
  'data-test'?: string;
}

export default function CardItemBase({
  id = '',
  nome,
  categoria,
  status,
  imagem,
  titulo,
  isLoading = false,
  onEdit,
  onDelete,
  onClick,
  onEmprestar,
  emprestarDesabilitado = false,
  emprestarTitle,
  metricas,
  acoesRapidas,
  'data-test': dataTest,
}: CardItemBaseProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick && id) {
      onClick(id);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagemComTimestamp) {
      setIsImageModalOpen(true);
    }
  };

  const categoriaFormatada = React.useMemo(() => {
    if (!categoria) return '';

    return categoria
      .toLocaleLowerCase('pt-BR')
      .split(' ')
      .filter(Boolean)
      .map(
        (palavra) =>
          palavra.charAt(0).toLocaleUpperCase('pt-BR') + palavra.slice(1),
      )
      .join(' ');
  }, [categoria]);

  const imagemComTimestamp = React.useMemo(() => {
    if (!imagem) return undefined;
    const separator = imagem.includes('?') ? '&' : '?';
    return `${imagem}${separator}t=${Date.now()}`;
  }, [imagem]);

  return (
    <div
      className="bg-card rounded-md border border-border p-4 transition-colors w-full h-full min-h-40 min-w-0 flex flex-col cursor-pointer relative"
      data-test={dataTest || `item-${id}`}
      title={titulo}
      onClick={handleClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-card/90 rounded-md flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-4 border-border/30"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-r-transparent animate-spin"
                style={{
                  borderColor:
                    'var(--ei-accent) transparent transparent transparent',
                }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Atualizando...</p>
          </div>
        </div>
      )}

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
                ? `Clique para ampliar a imagem de ${nome}`
                : ''
            }
          >
            {imagemComTimestamp ? (
              <img
                src={imagemComTimestamp}
                alt={nome}
                className="w-full h-full object-cover"
                title={`Imagem do item: ${nome}`}
              />
            ) : (
              <Package className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-hidden" data-test="text-info">
            <h3
              className="text-base font-semibold text-foreground leading-tight truncate"
              title={`${nome}`}
              data-test="component-name"
            >
              {nome}
            </h3>
            <p
              className="text-sm font-medium tracking-[0.03em] text-muted-foreground truncate mt-0.5"
              title={`${categoriaFormatada}`}
              data-test="component-category"
            >
              {categoriaFormatada}
            </p>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <ItemConsumoLinhaAcoes
            onEditar={() => onEdit && id && onEdit(id)}
            onEmprestar={() => onEmprestar && id && onEmprestar(id)}
            onExcluir={() => onDelete && id && onDelete(id)}
            emprestarDesabilitado={emprestarDesabilitado}
            emprestarTitle={emprestarTitle}
            data-test="actions-menu-button"
          />
        </div>
      </div>

      <div className="mt-auto" style={{ minHeight: '44px' }}>
        <div
          className="flex items-center justify-between gap-2 pt-3 overflow-hidden"
          data-test="footer"
        >
          <div
            className="flex flex-col text-sm min-w-0 shrink-0"
            data-test="quantity"
          >
            {metricas}
          </div>

          <div
            className="flex items-center gap-1.5 justify-center flex-1 min-w-0 overflow-hidden px-2"
            data-test="status-container"
          >
            <StatusBadge status={status} data-test="status-badge" />
          </div>

          {acoesRapidas && (
            <div
              className="flex items-center gap-0.5 shrink-0"
              data-test="movement-icons"
            >
              {acoesRapidas}
            </div>
          )}
        </div>
      </div>

      {imagemComTimestamp && (
        <ModalVisualizarImagem
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imagemUrl={imagemComTimestamp}
          nomeItem={nome}
        />
      )}
    </div>
  );
}
