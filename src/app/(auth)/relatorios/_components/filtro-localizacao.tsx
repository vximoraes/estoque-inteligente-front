'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import type { ApiEnvelope, Localizacao } from '@/types/itens';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface FiltroLocalizacaoProps {
  value: string;
  onChange: (localizacaoId: string) => void;
  className?: string;
  'data-test'?: string;
}

// Variante compacta, só-filtro, do dropdown com busca de
// `campo-localizacao.tsx` (que é a versão de formulário, com label,
// obrigatoriedade e ações de gerenciar) — sem label, com opção "Todas as
// localizações", do tamanho dos demais controles de uma barra de filtros.
export default function FiltroLocalizacao({
  value,
  onChange,
  className = '',
  'data-test': dataTest = 'filtro-localizacao',
}: FiltroLocalizacaoProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pesquisa, setPesquisa] = useState('');

  const { data: localizacoesData, isLoading } = useQuery({
    queryKey: ['localizacoes'],
    queryFn: () => get<ApiEnvelope<Localizacao>>('/localizacoes?limite=100'),
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filtro-localizacao-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const localizacoes = localizacoesData?.data?.docs ?? [];
  const localizacoesFiltradas = localizacoes.filter((loc) =>
    loc.nome.toLowerCase().includes(pesquisa.toLowerCase()),
  );
  const localizacaoSelecionada = localizacoes.find((loc) => loc._id === value);

  return (
    <div
      className={`relative ${className}`}
      data-filtro-localizacao-dropdown
      data-test={dataTest}
    >
      <button
        type="button"
        onClick={() => setIsDropdownOpen((open) => !open)}
        disabled={isLoading}
        className="w-full h-11 flex items-center justify-between px-3 bg-background/30 dark:bg-input/30 border border-border rounded-md hover:bg-background/50 focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 transition-colors cursor-pointer"
        data-test="filtro-localizacao-trigger"
      >
        <span className="truncate text-sm">
          {isLoading
            ? 'Carregando...'
            : (localizacaoSelecionada?.nome ?? 'Todas as localizações')}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border bg-muted">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
              onClick={(e) => e.stopPropagation()}
              data-test="filtro-localizacao-pesquisa"
            />
          </div>
          <div className="overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsDropdownOpen(false);
                setPesquisa('');
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer ${
                !value
                  ? 'text-[var(--ei-accent)] font-medium'
                  : 'text-foreground'
              }`}
              data-test="filtro-localizacao-todas"
            >
              Todas as localizações
            </button>
            {localizacoesFiltradas.length > 0 ? (
              localizacoesFiltradas.map((loc) => (
                <Tooltip key={loc._id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(loc._id);
                        setIsDropdownOpen(false);
                        setPesquisa('');
                      }}
                      className={`w-full text-left px-3 py-2 text-sm truncate hover:bg-muted transition-colors cursor-pointer ${
                        value === loc._id
                          ? 'text-[var(--ei-accent)] font-medium bg-[var(--ei-accent)]/10'
                          : 'text-foreground'
                      }`}
                      data-test="filtro-localizacao-opcao"
                    >
                      {loc.nome}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{loc.nome}</TooltipContent>
                </Tooltip>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                Nenhuma localização encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
