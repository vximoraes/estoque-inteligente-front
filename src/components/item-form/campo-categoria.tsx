'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronDown, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { toast } from 'react-toastify';
import ModalEditarCategoria from '@/components/categoria/modal-editar-categoria';
import ModalExcluirCategoria from '@/components/categoria/modal-excluir-categoria';
import { ModalShell } from '@/components/ui/modal-shell';
import type { Categoria, CategoriaApiResponse } from '@/types/categorias';
import type { ItemTipo } from '@/types/itens';

interface CampoCategoriaProps {
  value: string;
  onChange: (categoriaId: string) => void;
  /** Domínio da categoria: 'consumo' (almoxarifado) ou 'permanente' (patrimônio). */
  tipo: ItemTipo;
  error?: string;
  /** Controla o `enabled` da query de categorias — passe `isOpen` do modal pai. */
  enabled?: boolean;
  'data-test'?: string;
}

// Dropdown de categoria com busca, criação inline (nome + descrição) e
// ações de editar/excluir por linha. Extraído de `modal-cadastrar-item.tsx`
// para ser reaproveitado pelos formulários de consumo e de patrimônio.
// A lista é restrita ao `tipo` do formulário — categoria de almoxarifado
// nunca aparece no formulário de patrimônio, e vice-versa.
export default function CampoCategoria({
  value,
  onChange,
  tipo,
  error,
  enabled = true,
  'data-test': dataTest = 'botao-selecionar-categoria',
}: CampoCategoriaProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaCategoriaDescricao, setNovaCategoriaDescricao] = useState('');
  const [novaCategoriaErro, setNovaCategoriaErro] = useState<string>();
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { data: categoriasData, isLoading } = useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async () => {
      return await get<CategoriaApiResponse>(
        `/categorias?tipo=${tipo}&limite=100&page=1`,
      );
    },
    enabled,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-categoria-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const createCategoriaMutation = useMutation({
    mutationFn: async (dados: { nome: string; descricao?: string }) => {
      return await post('/categorias', { ...dados, tipo });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['categorias', tipo] });
      onChange(data.data._id);
      setNovaCategoria('');
      setNovaCategoriaDescricao('');
      setIsAdding(false);
      setNovaCategoriaErro(undefined);
      toast.success('Categoria criada com sucesso!', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    },
    onError: (error: any) => {
      setNovaCategoriaErro(error?.response?.data?.message || error.message);
    },
  });

  const handleAddCategoria = () => {
    if (!novaCategoria.trim()) {
      setNovaCategoriaErro('Nome da categoria é obrigatório');
      return;
    }
    setNovaCategoriaErro(undefined);
    createCategoriaMutation.mutate({
      nome: novaCategoria,
      descricao: novaCategoriaDescricao.trim() || undefined,
    });
  };

  const categorias = categoriasData?.data?.docs ?? [];
  const categoriasFiltradas = categorias.filter((cat: Categoria) =>
    cat.nome.toLowerCase().includes(pesquisa.toLowerCase()),
  );
  const categoriaSelecionada = categorias.find(
    (cat: Categoria) => cat._id === value,
  );

  return (
    <div>
      <Label className="text-sm font-semibold text-foreground tracking-tight mb-2 block">
        Categoria <span className="text-destructive">*</span>
      </Label>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0" data-categoria-dropdown>
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
                className={`truncate ${categoriaSelecionada ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {isLoading
                  ? 'Carregando...'
                  : categoriaSelecionada?.nome || 'Selecione uma categoria'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && !isLoading && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 sm:max-h-80 overflow-hidden flex flex-col">
                <div className="p-2 sm:p-3 border-b border-border bg-muted">
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                    data-test="input-pesquisa-categoria"
                  />
                </div>

                <div className="overflow-y-auto">
                  {categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map((categoria: Categoria) => (
                      <div
                        key={categoria._id}
                        className={`flex items-center justify-between px-3 sm:px-4 py-2 hover:bg-muted transition-colors group ${
                          value === categoria._id
                            ? 'bg-[var(--ei-accent)]/10'
                            : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onChange(categoria._id);
                            setIsDropdownOpen(false);
                            setPesquisa('');
                          }}
                          className={`flex-1 text-left cursor-pointer text-sm sm:text-base truncate ${
                            value === categoria._id
                              ? 'text-[var(--ei-accent)] font-medium'
                              : 'text-foreground'
                          }`}
                          title={categoria.nome}
                          data-test="categoria-option"
                        >
                          {categoria.nome}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoriaToEdit(categoria);
                              setIsEditarModalOpen(true);
                            }}
                            className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                            title="Editar categoria"
                            data-test="botao-editar-categoria"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoriaToEdit(categoria);
                              setIsExcluirModalOpen(true);
                            }}
                            className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                            title="Excluir categoria"
                            data-test="botao-excluir-categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 sm:py-8 text-center text-muted-foreground text-xs sm:text-sm">
                      Nenhuma categoria encontrada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-ei-accent-foreground h-11! w-11! p-0! flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="botao-adicionar-categoria"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <p className="text-destructive text-xs sm:text-sm">{error}</p>
        )}
      </div>

      <ModalShell
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
          setNovaCategoria('');
          setNovaCategoriaDescricao('');
          setNovaCategoriaErro(undefined);
        }}
        data-test="modal-adicionar-categoria"
        zIndex={100000}
        contentClassName="max-w-md overflow-visible"
      >
        <div className="relative p-6 pb-0">
          <button
            onClick={() => {
              setIsAdding(false);
              setNovaCategoria('');
              setNovaCategoriaDescricao('');
              setNovaCategoriaErro(undefined);
            }}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            title="Fechar"
            data-test="botao-fechar-modal-categoria"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <div className="text-center pt-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Cadastrar categoria
            </h2>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="novaCategoria" className="text-sm font-medium">
                Nome <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {novaCategoria.length}/50
              </span>
            </div>
            <Input
              id="novaCategoria"
              type="text"
              placeholder="Nome da categoria"
              value={novaCategoria}
              onChange={(e) => {
                setNovaCategoria(e.target.value);
                if (novaCategoriaErro) setNovaCategoriaErro(undefined);
              }}
              maxLength={50}
              className={`h-11 ${novaCategoriaErro ? 'border-destructive' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategoria();
                }
              }}
              data-test="input-nova-categoria"
            />
            {novaCategoriaErro && (
              <p className="text-destructive text-xs mt-1">
                {novaCategoriaErro}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label
                htmlFor="novaCategoriaDescricao"
                className="text-sm font-medium"
              >
                Descrição
              </Label>
              <span className="text-xs text-muted-foreground">
                {novaCategoriaDescricao.length}/200
              </span>
            </div>
            <textarea
              id="novaCategoriaDescricao"
              placeholder="Breve descrição da categoria..."
              value={novaCategoriaDescricao}
              onChange={(e) => setNovaCategoriaDescricao(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 text-sm bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors resize-none min-h-[100px]"
              data-test="input-nova-categoria-descricao"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNovaCategoria('');
                setNovaCategoriaDescricao('');
                setNovaCategoriaErro(undefined);
              }}
              disabled={createCategoriaMutation.isPending}
              className="h-11 flex-1 cursor-pointer"
              data-test="botao-cancelar-modal-categoria"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddCategoria}
              disabled={createCategoriaMutation.isPending}
              className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--ei-accent)' }}
              data-test="botao-criar-categoria"
            >
              {createCategoriaMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </ModalShell>

      {categoriaToEdit && (
        <>
          <ModalEditarCategoria
            isOpen={isEditarModalOpen}
            onClose={() => {
              setIsEditarModalOpen(false);
              setCategoriaToEdit(null);
            }}
            categoriaId={categoriaToEdit._id}
            categoriaNome={categoriaToEdit.nome}
            categoriaDescricao={categoriaToEdit.descricao}
            onSuccess={() => setIsDropdownOpen(false)}
          />
          <ModalExcluirCategoria
            isOpen={isExcluirModalOpen}
            onClose={() => {
              setIsExcluirModalOpen(false);
              setCategoriaToEdit(null);
            }}
            categoriaId={categoriaToEdit._id}
            categoriaNome={categoriaToEdit.nome}
            onSuccess={() => setIsDropdownOpen(false)}
          />
        </>
      )}
    </div>
  );
}
