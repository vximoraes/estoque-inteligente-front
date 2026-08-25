'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import ModalCadastrarLocalizacao from '@/components/modal-cadastrar-localizacao';
import ModalEditarLocalizacao from '@/components/modal-editar-localizacao';
import ModalExcluirLocalizacao from '@/components/modal-excluir-localizacao';
import type { Localizacao } from '@/types/itens';

interface LocalizacoesApiResponse {
  data: {
    docs: Localizacao[];
  };
}

interface CampoLocalizacaoProps {
  value: string;
  onChange: (localizacaoId: string) => void;
  error?: string;
  label?: string;
  obrigatorio?: boolean;
  /** Esconde o botão "+" e as ações de editar/excluir — modo somente-seleção. */
  permitirGerenciar?: boolean;
  enabled?: boolean;
  'data-test'?: string;
}

// Dropdown de localização com busca, criação inline e ações de editar/
// excluir por linha. Extraído de `modal-cadastrar-item.tsx`; reaproveitado
// pelo cadastro de patrimônio e pela página de unidades (em modo somente-
// seleção, via `permitirGerenciar={false}`).
export default function CampoLocalizacao({
  value,
  onChange,
  error,
  label = 'Localização',
  obrigatorio = true,
  permitirGerenciar = true,
  enabled = true,
  'data-test': dataTest = 'botao-selecionar-localizacao',
}: CampoLocalizacaoProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [localizacaoToEdit, setLocalizacaoToEdit] =
    useState<Localizacao | null>(null);

  const { data: localizacoesData, isLoading } = useQuery({
    queryKey: ['localizacoes'],
    queryFn: async () => {
      return await get<LocalizacoesApiResponse>(
        `/localizacoes?limite=100&page=1`,
      );
    },
    enabled,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-localizacao-dropdown]')) {
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
    <div>
      <Label className="text-sm font-semibold text-foreground tracking-tight mb-2 block">
        {label} {obrigatorio && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0" data-localizacao-dropdown>
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
              className={`truncate ${localizacaoSelecionada ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {isLoading
                ? 'Carregando...'
                : localizacaoSelecionada?.nome || 'Selecione a localização'}
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
                  data-test="input-pesquisa-localizacao"
                />
              </div>
              <div className="overflow-y-auto">
                {localizacoesFiltradas.length > 0 ? (
                  localizacoesFiltradas.map((loc) => (
                    <div
                      key={loc._id}
                      className={`flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-muted transition-colors group ${
                        value === loc._id ? 'bg-[var(--ei-accent)]/10' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChange(loc._id);
                          setIsDropdownOpen(false);
                          setPesquisa('');
                        }}
                        className={`flex-1 text-left cursor-pointer text-sm sm:text-base truncate ${
                          value === loc._id
                            ? 'text-[var(--ei-accent)] font-medium'
                            : 'text-foreground'
                        }`}
                        title={loc.nome}
                        data-test="localizacao-option"
                      >
                        {loc.nome}
                      </button>
                      {permitirGerenciar && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalizacaoToEdit(loc);
                              setIsEditarModalOpen(true);
                            }}
                            className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                            title="Editar localização"
                            data-test="botao-editar-localizacao"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalizacaoToEdit(loc);
                              setIsExcluirModalOpen(true);
                            }}
                            className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                            title="Excluir localização"
                            data-test="botao-excluir-localizacao"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 sm:py-8 text-center text-muted-foreground text-xs sm:text-sm">
                    Nenhuma localização encontrada
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {permitirGerenciar && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-ei-accent-foreground h-11! w-11! p-0! flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="botao-adicionar-localizacao"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
      {error && (
        <p className="text-destructive text-xs sm:text-sm mt-1">{error}</p>
      )}

      {permitirGerenciar && (
        <>
          <ModalCadastrarLocalizacao
            isOpen={isAdding}
            onClose={() => setIsAdding(false)}
            onSuccess={() => setIsAdding(false)}
          />

          {localizacaoToEdit && (
            <>
              <ModalEditarLocalizacao
                isOpen={isEditarModalOpen}
                onClose={() => {
                  setIsEditarModalOpen(false);
                  setLocalizacaoToEdit(null);
                }}
                localizacaoId={localizacaoToEdit._id}
                localizacaoNome={localizacaoToEdit.nome}
                localizacaoDescricao={localizacaoToEdit.descricao}
                onSuccess={() => setIsDropdownOpen(false)}
              />
              <ModalExcluirLocalizacao
                isOpen={isExcluirModalOpen}
                onClose={() => {
                  setIsExcluirModalOpen(false);
                  setLocalizacaoToEdit(null);
                }}
                localizacaoId={localizacaoToEdit._id}
                localizacaoNome={localizacaoToEdit.nome}
                onSuccess={() => setIsDropdownOpen(false)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
