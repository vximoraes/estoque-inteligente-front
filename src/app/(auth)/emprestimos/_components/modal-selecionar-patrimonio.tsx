'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import { ModalShell } from '@/components/ui/modal-shell';
import { PulseLoader } from 'react-spinners';
import type {
  PatrimonioApiResponse,
  PatrimonioData,
} from '@/types/patrimonios';

interface ModalSelecionarPatrimonioProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patrimonio: PatrimonioData) => void;
}

export default function ModalSelecionarPatrimonio({
  isOpen,
  onClose,
  onSelect,
}: ModalSelecionarPatrimonioProps) {
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (isOpen) setBusca('');
  }, [isOpen]);

  const { data, isLoading } = useQuery<PatrimonioApiResponse>({
    queryKey: ['patrimonios-disponiveis-emprestimo', busca],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'Disponível');
      if (busca) params.append('busca', busca);
      params.append('limite', '20');
      return await get<PatrimonioApiResponse>(
        `/patrimonios?${params.toString()}`,
      );
    },
    enabled: isOpen,
  });

  const unidades = data?.data?.docs || [];

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      data-test="modal-selecionar-patrimonio"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[80vh] flex flex-col"
    >
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={20} />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground">
            Selecionar unidade
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Só unidades com status Disponível aparecem aqui.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar por número, modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-11 pl-10 pr-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            data-test="modal-selecionar-patrimonio-pesquisa"
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh] border border-border rounded-md">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <PulseLoader color="var(--ei-accent)" size={8} />
            </div>
          ) : unidades.length > 0 ? (
            unidades.map((unidade) => (
              <button
                type="button"
                key={unidade._id}
                onClick={() => onSelect(unidade)}
                className="w-full flex items-center justify-between gap-2 text-left px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-b-0"
                data-test="modal-selecionar-patrimonio-opcao"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {unidade.numero_patrimonio}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {unidade.modelo || unidade.categoria.nome}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {unidade.localizacao.nome}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">
              Nenhuma unidade disponível encontrada
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
