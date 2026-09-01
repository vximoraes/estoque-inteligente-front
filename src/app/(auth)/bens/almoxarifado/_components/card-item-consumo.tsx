'use client';
import { PlusCircle, MinusCircle } from 'lucide-react';
import CardItemBase from './card-item-base';

interface CardItemConsumoProps {
  id?: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo?: number;
  status: string;
  imagem?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onEntrada?: (id: string) => void;
  onSaida?: (id: string) => void;
  onEmprestar?: (id: string) => void;
  isLoading?: boolean;
  'data-test'?: string;
}

export default function CardItemConsumo({
  id = '',
  nome,
  categoria,
  quantidade,
  estoqueMinimo,
  status,
  imagem,
  onEdit,
  onDelete,
  onClick,
  onEntrada,
  onSaida,
  onEmprestar,
  isLoading = false,
  'data-test': dataTest,
}: CardItemConsumoProps) {
  const handleEntrada = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEntrada && id) onEntrada(id);
  };

  const handleSaida = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaida && id) onSaida(id);
  };

  return (
    <CardItemBase
      id={id}
      nome={nome}
      categoria={categoria}
      status={status}
      imagem={imagem}
      titulo={`${nome} - ${categoria} - Qtd: ${quantidade} - Status: ${status}`}
      isLoading={isLoading}
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onClick}
      onEmprestar={onEmprestar}
      emprestarDesabilitado={quantidade === 0}
      emprestarTitle={`${nome} sem estoque disponível para empréstimo`}
      data-test={dataTest}
      metricas={
        <>
          <span title={`Quantidade em estoque: ${quantidade} unidades`}>
            <span className="text-muted-foreground font-medium">Qtd</span>
            <span className="font-semibold text-foreground ml-1 tabular-nums text-base">
              {quantidade}
            </span>
          </span>
          {estoqueMinimo !== undefined && (
            <span
              className="mt-0.5"
              title={`Estoque mínimo: ${estoqueMinimo} unidades`}
            >
              <span className="text-muted-foreground font-medium">Mín</span>
              <span className="font-semibold text-foreground ml-1 tabular-nums text-base">
                {estoqueMinimo}
              </span>
            </span>
          )}
        </>
      }
      acoesRapidas={
        <>
          <button
            className="p-1.5 rounded-md hover:bg-muted/40 transition-colors duration-150 cursor-pointer shrink-0"
            title={`Registrar entrada de ${nome}`}
            data-test="entrada-icon"
            onClick={handleEntrada}
          >
            <PlusCircle size={16} className="text-foreground" />
          </button>
          <button
            className={`p-1.5 rounded-md transition-colors duration-150 shrink-0 ${
              quantidade === 0
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-muted/40 cursor-pointer'
            }`}
            title={
              quantidade === 0
                ? `${nome} sem estoque disponível`
                : `Registrar saída de ${nome}`
            }
            data-test="saida-icon"
            onClick={quantidade === 0 ? undefined : handleSaida}
            disabled={quantidade === 0}
          >
            <MinusCircle
              size={16}
              className={
                quantidade === 0 ? 'text-muted-foreground' : 'text-foreground'
              }
            />
          </button>
        </>
      }
    />
  );
}
