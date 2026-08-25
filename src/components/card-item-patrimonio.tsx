'use client';
import CardItemBase from './card-item-base';

interface CardItemPatrimonioProps {
  id?: string;
  nome: string;
  categoria: string;
  quantidade: number;
  quantidadeDisponivel: number;
  status: string;
  imagem?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onEmprestar?: (id: string) => void;
  isLoading?: boolean;
  'data-test'?: string;
}

export default function CardItemPatrimonio({
  id = '',
  nome,
  categoria,
  quantidade,
  quantidadeDisponivel,
  status,
  imagem,
  onEdit,
  onDelete,
  onClick,
  onEmprestar,
  isLoading = false,
  'data-test': dataTest,
}: CardItemPatrimonioProps) {
  return (
    <CardItemBase
      id={id}
      nome={nome}
      categoria={categoria}
      status={status}
      imagem={imagem}
      titulo={`${nome} - ${categoria} - Unid: ${quantidade} - Status: ${status}`}
      isLoading={isLoading}
      onEdit={onEdit}
      onDelete={onDelete}
      onClick={onClick}
      onEmprestar={onEmprestar}
      emprestarDesabilitado={quantidadeDisponivel === 0}
      emprestarTitle={`${nome} sem unidade disponível para empréstimo`}
      data-test={dataTest}
      metricas={
        <>
          <span
            title={`${quantidade} unidade${quantidade === 1 ? '' : 's'} ao todo`}
          >
            <span className="text-muted-foreground font-medium">Unid</span>
            <span className="font-semibold text-foreground ml-1 tabular-nums text-base">
              {quantidade}
            </span>
          </span>
          <span
            className="mt-0.5"
            title={`${quantidadeDisponivel} unidade${quantidadeDisponivel === 1 ? '' : 's'} dispon${quantidadeDisponivel === 1 ? 'ível' : 'íveis'} para empréstimo`}
          >
            <span className="text-muted-foreground font-medium">Disp</span>
            <span className="font-semibold text-foreground ml-1 tabular-nums text-base">
              {quantidadeDisponivel}
            </span>
          </span>
        </>
      }
    />
  );
}
