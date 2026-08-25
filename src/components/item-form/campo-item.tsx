'use client';

// Dropdown de seleção do modelo (`Item` tipo 'permanente') ao qual uma
// unidade de patrimônio pertence — mesma estrutura de
// `campo-localizacao.tsx`. O "+" abre `ModalCadastrarItemPatrimonio` para
// criar um modelo novo sem sair do formulário de cadastro de patrimônio,
// já que a tela de patrimônio não lista mais os modelos separadamente.

import { useEffect, useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import ModalCadastrarItemPatrimonio from '@/components/modal-cadastrar-item-patrimonio';
import type { ItemPermanenteApiResponse } from '@/types/itens';

interface CampoItemProps {
  value: string;
  onChange: (itemId: string) => void;
  error?: string;
  enabled?: boolean;
  'data-test'?: string;
}

export default function CampoItem({
  value,
  onChange,
  error,
  enabled = true,
  'data-test': dataTest = 'botao-selecionar-item',
}: CampoItemProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [isCadastrarModeloOpen, setIsCadastrarModeloOpen] = useState(false);

  const { data: itensData, isLoading } = useQuery<ItemPermanenteApiResponse>({
    queryKey: ['itens', 'permanente', 'seletor'],
    queryFn: () => get<ItemPermanenteApiResponse>('/itens?tipo=permanente&limite=100'),
    enabled,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-item-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const itens = itensData?.data?.docs ?? [];
  const itensFiltrados = itens.filter((item) =>
    item.nome.toLowerCase().includes(pesquisa.toLowerCase()),
  );
  const itemSelecionado = itens.find((item) => item._id === value);

  return (
    <div>
      <Label className="text-sm font-semibold text-foreground tracking-tight mb-2 block">
        Modelo <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0" data-item-dropdown>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full h-11 flex items-center justify-between px-3 bg-card border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors cursor-pointer ${
              error ? 'border-destructive' : 'border-border'
            }`}
            disabled={isLoading}
            data-test={dataTest}
          >
            <span
              className={`truncate ${itemSelecionado ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {isLoading
                ? 'Carregando...'
                : itemSelecionado?.nome || 'Selecione o modelo'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDropdownOpen && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
              <div className="p-2 sm:p-3 border-b border-border bg-muted">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                  data-test="input-pesquisa-item"
                />
              </div>
              <div className="overflow-y-auto">
                {itensFiltrados.length > 0 ? (
                  itensFiltrados.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        onChange(item._id);
                        setIsDropdownOpen(false);
                        setPesquisa('');
                      }}
                      className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-muted transition-colors text-left cursor-pointer text-sm sm:text-base truncate ${
                        value === item._id
                          ? 'bg-[var(--ei-accent)]/10 text-[var(--ei-accent)] font-medium'
                          : 'text-foreground'
                      }`}
                      title={item.nome}
                      data-test="item-option"
                    >
                      <span className="truncate">{item.nome}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {item.categoria.nome}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 sm:py-8 text-center text-muted-foreground text-xs sm:text-sm">
                    Nenhum modelo encontrado
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={() => setIsCadastrarModeloOpen(true)}
          className="text-ei-accent-foreground h-11! w-11! p-0! flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
          style={{ backgroundColor: 'var(--ei-accent)' }}
          title="Cadastrar novo modelo"
          data-test="botao-adicionar-item"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {error && (
        <p className="text-destructive text-xs sm:text-sm mt-1">{error}</p>
      )}

      <ModalCadastrarItemPatrimonio
        isOpen={isCadastrarModeloOpen}
        onClose={() => setIsCadastrarModeloOpen(false)}
        onSuccess={(item) => {
          onChange(item.id);
          setIsCadastrarModeloOpen(false);
        }}
      />
    </div>
  );
}
