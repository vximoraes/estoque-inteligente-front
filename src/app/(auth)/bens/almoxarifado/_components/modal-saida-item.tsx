import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';
import ModalEditarLocalizacao from '@/components/localizacao/modal-editar-localizacao';
import ModalExcluirLocalizacao from '@/components/localizacao/modal-excluir-localizacao';

interface Localizacao {
  _id: string;
  nome: string;
  ativo?: boolean;
  descricao?: string;
}

interface EstoqueData {
  _id: string;
  localizacao: {
    _id: string;
    nome: string;
    ativo?: boolean;
  };
  item: string;
  quantidade: number;
}

interface EstoqueApiResponse {
  error: boolean;
  code: number;
  message: string;
  data: {
    docs: EstoqueData[];
  };
}

interface MovimentacaoRequest {
  tipo: 'saida';
  quantidade: string;
  item: string;
  localizacao: string;
}

interface ModalSaidaItemProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemNome: string;
  onSuccess?: () => void;
}

export default function ModalSaidaItem({
  isOpen,
  onClose,
  itemId,
  itemNome,
  onSuccess,
}: ModalSaidaItemProps) {
  const queryClient = useQueryClient();
  const [quantidade, setQuantidade] = useState('');
  const [localizacaoSelecionada, setLocalizacaoSelecionada] =
    useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localizacaoPesquisa, setLocalizacaoPesquisa] = useState('');
  const [errors, setErrors] = useState<{
    quantidade?: string;
    localizacao?: string;
  }>({});
  const [isEditarLocalizacaoModalOpen, setIsEditarLocalizacaoModalOpen] =
    useState(false);
  const [isExcluirLocalizacaoModalOpen, setIsExcluirLocalizacaoModalOpen] =
    useState(false);
  const [localizacaoToEdit, setLocalizacaoToEdit] =
    useState<Localizacao | null>(null);
  const [retirarTudo, setRetirarTudo] = useState(false);
  const autoSelecionouLocalizacao = useRef(false);

  const { data: estoquesData, isLoading: isLoadingLocalizacoes } =
    useQuery<EstoqueApiResponse>({
      queryKey: ['estoques', itemId],
      queryFn: async () => {
        return await get<EstoqueApiResponse>(`/estoques/item/${itemId}`);
      },
      enabled: isOpen && !!itemId,
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('Falha na autenticação')) {
          return false;
        }
        return failureCount < 3;
      },
    });

  const saidaMutation = useMutation({
    mutationFn: async (data: MovimentacaoRequest) => {
      return await post('/movimentacoes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['itens'],
      });

      queryClient.removeQueries({
        queryKey: ['estoques', itemId],
      });

      setQuantidade('');
      setLocalizacaoSelecionada('');
      setErrors({});
      setRetirarTudo(false);
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao registrar saída:', error);
      if (error?.response?.data) {
        console.error('Resposta da API:', error.response.data);

        const errorData = error.response.data;
        let errorMessage = 'Não foi possível registrar a saída';

        console.log('errorData completo:', JSON.stringify(errorData));
        console.log('errorData.errors:', errorData.errors);

        if (
          errorData.errors &&
          Array.isArray(errorData.errors) &&
          errorData.errors.length > 0
        ) {
          const messages = errorData.errors
            .map((err: any) => err.message)
            .filter(Boolean);
          console.log('mensagens extraídas:', messages);
          if (messages.length > 0) {
            errorMessage = messages.join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }

        console.log('mensagem final do toast:', errorMessage);

        toast.error(errorMessage, {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error('Não foi possível registrar a saída.', {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuantidade('');
      setLocalizacaoSelecionada('');
      setErrors({});
      setIsDropdownOpen(false);
      setRetirarTudo(false);
      autoSelecionouLocalizacao.current = false;
    }
  }, [isOpen]);

  const estoques = (estoquesData?.data?.docs || []).filter(
    (e) => e.localizacao?.ativo !== false,
  );
  const localizacoes = estoques
    .filter((e) => e.quantidade > 0)
    .map((e) => e.localizacao);

  useEffect(() => {
    if (!isOpen || autoSelecionouLocalizacao.current) return;
    if (estoquesData === undefined) return;

    autoSelecionouLocalizacao.current = true;

    const estoquesComSaldo = estoques.filter((e) => e.quantidade > 0);
    if (estoquesComSaldo.length === 0) return;

    const estoqueComMaisQuantidade = [...estoquesComSaldo].sort(
      (a, b) => (b.quantidade || 0) - (a.quantidade || 0),
    )[0];

    if (estoqueComMaisQuantidade?.localizacao?._id) {
      setLocalizacaoSelecionada(estoqueComMaisQuantidade.localizacao._id);
    }
  }, [isOpen, estoquesData]);
  const localizacoesFiltradas = localizacoes.filter((loc: Localizacao) =>
    loc.nome.toLowerCase().includes(localizacaoPesquisa.toLowerCase()),
  );
  const localizacaoSelecionadaObj = localizacoes.find(
    (loc) => loc._id === localizacaoSelecionada,
  );

  const getQuantidadeDisponivel = (localizacaoId: string): number => {
    const estoque = estoques.find((e) => e.localizacao._id === localizacaoId);
    return estoque?.quantidade || 0;
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setQuantidade(value);
      if (errors.quantidade) {
        setErrors((prev) => ({ ...prev, quantidade: undefined }));
      }
    }
  };

  const handleLocalizacaoSelect = (localizacao: Localizacao) => {
    setLocalizacaoSelecionada(localizacao._id);
    setIsDropdownOpen(false);
    setLocalizacaoPesquisa('');
    if (errors.localizacao) {
      setErrors((prev) => ({ ...prev, localizacao: undefined }));
    }
    if (retirarTudo) {
      const disponivel = getQuantidadeDisponivel(localizacao._id);
      setQuantidade(disponivel > 0 ? String(disponivel) : '');
    }
  };

  const handleRetirarTudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRetirarTudo(checked);
    if (checked && localizacaoSelecionada) {
      const disponivel = getQuantidadeDisponivel(localizacaoSelecionada);
      setQuantidade(disponivel > 0 ? String(disponivel) : '');
    }
    if (errors.quantidade) {
      setErrors((prev) => ({ ...prev, quantidade: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { quantidade?: string; localizacao?: string } = {};

    if (!quantidade || quantidade === '0') {
      newErrors.quantidade = 'Quantidade deve ser maior que 0';
    } else if (
      localizacaoSelecionada &&
      Number(quantidade) > getQuantidadeDisponivel(localizacaoSelecionada)
    ) {
      newErrors.quantidade = 'Quantidade maior que a disponível em estoque';
    }

    if (!localizacaoSelecionada) {
      newErrors.localizacao = 'Selecionar localização';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (!itemId) {
      setErrors({ ...errors, quantidade: 'ID do item não encontrado' });
      return;
    }

    if (!quantidade || quantidade.trim() === '') {
      setErrors({ ...errors, quantidade: 'Quantidade é obrigatória' });
      return;
    }

    if (!localizacaoSelecionada || localizacaoSelecionada.trim() === '') {
      setErrors({ ...errors, localizacao: 'Localização é obrigatória' });
      return;
    }

    const movimentacaoData: MovimentacaoRequest = {
      tipo: 'saida',
      quantidade: quantidade.trim(),
      item: itemId.trim(),
      localizacao: localizacaoSelecionada.trim(),
    };

    saidaMutation.mutate(movimentacaoData);
  };

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      data-test="modal-saida-backdrop"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[80vh] overflow-visible"
      role="dialog"
      contentDataTest="modal-saida"
    >
      {/* Botão de fechar */}
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
          data-test="modal-saida-close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Conteúdo do Modal */}
      <div className="px-6 pb-6 space-y-6" data-test="modal-saida-content">
        <div className="text-center pt-4 px-8">
          <div className="max-h-[100px] overflow-y-auto">
            <h2
              className="text-xl font-semibold text-foreground mb-1 wrap-break-word"
              data-test="modal-saida-titulo"
            >
              Registrar saída de {itemNome}
            </h2>
          </div>
        </div>

        {/* Campo Quantidade */}
        <div className="space-y-2" data-test="modal-saida-quantidade-container">
          <label
            htmlFor="quantidade"
            className="block text-base font-medium text-foreground"
          >
            Quantidade <span className="text-destructive">*</span>
          </label>
          <input
            id="quantidade"
            name="quantidade"
            type="text"
            placeholder="Digite a quantidade"
            value={quantidade}
            onChange={handleQuantidadeChange}
            maxLength={9}
            className={`w-full h-11 px-3 text-base md:text-sm bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.quantidade ? 'border-destructive' : 'border-border'
            }`}
            disabled={saidaMutation.isPending || retirarTudo}
            data-test="modal-saida-quantidade-input"
          />
          {errors.quantidade && (
            <p
              className="text-destructive text-sm mt-1"
              data-test="modal-saida-quantidade-erro"
            >
              {errors.quantidade}
            </p>
          )}
        </div>

        {/* Campo Localização */}
        <div
          className="space-y-2"
          data-test="modal-saida-localizacao-container"
        >
          <label className="block text-base font-medium text-foreground">
            Localização <span className="text-destructive">*</span>
          </label>
          <div className="relative" data-dropdown>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full h-11 flex items-center justify-between px-3 bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                errors.localizacao ? 'border-destructive' : 'border-border'
              }`}
              disabled={isLoadingLocalizacoes || saidaMutation.isPending}
              data-test="modal-saida-localizacao-dropdown"
            >
              <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                <span
                  className={`truncate block ${localizacaoSelecionada ? 'max-w-[45px] sm:max-w-[120px]' : 'max-w-full'} ${localizacaoSelecionadaObj ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {isLoadingLocalizacoes
                    ? 'Carregando...'
                    : localizacaoSelecionadaObj?.nome ||
                      'Selecionar localização'}
                </span>
                {localizacaoSelecionada && (
                  <span
                    className={`text-sm px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                      getQuantidadeDisponivel(localizacaoSelecionada) > 0
                        ? 'bg-muted/50 text-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {getQuantidadeDisponivel(localizacaoSelecionada)} disponível
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && !isLoadingLocalizacoes && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md z-50 max-h-60 overflow-hidden flex flex-col">
                {/* Input de pesquisa */}
                <div className="p-3 border-b border-border bg-muted/50">
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={localizacaoPesquisa}
                    onChange={(e) => setLocalizacaoPesquisa(e.target.value)}
                    className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Lista de localizações */}
                <div className="overflow-y-auto">
                  {localizacoesFiltradas.length > 0 ? (
                    <>
                      {localizacoesFiltradas.map((localizacao) => {
                        const qtdDisponivel = getQuantidadeDisponivel(
                          localizacao._id,
                        );
                        return (
                          <div
                            key={localizacao._id}
                            className={`flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors group ${
                              localizacaoSelecionada === localizacao._id
                                ? 'bg-[var(--ei-accent)]/5'
                                : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleLocalizacaoSelect(localizacao)
                              }
                              className={`flex-1 flex items-center gap-2 text-left cursor-pointer min-w-0 ${
                                localizacaoSelecionada === localizacao._id
                                  ? 'text-[var(--ei-accent)] font-medium'
                                  : 'text-foreground'
                              }`}
                              title={localizacao.nome}
                            >
                              <span className="truncate">
                                {localizacao.nome}
                              </span>
                              <span
                                className={`text-sm px-2 py-0.5 rounded-md shrink-0 ${
                                  qtdDisponivel > 0
                                    ? 'bg-muted/50 text-foreground'
                                    : 'bg-muted/50 text-muted-foreground'
                                }`}
                              >
                                {qtdDisponivel} disponível
                              </span>
                            </button>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocalizacaoToEdit(localizacao);
                                  setIsEditarLocalizacaoModalOpen(true);
                                }}
                                className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                title="Editar localização"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocalizacaoToEdit(localizacao);
                                  setIsExcluirLocalizacaoModalOpen(true);
                                }}
                                className="p-1.5 text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                                title="Excluir localização"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhuma localização encontrada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.localizacao && (
            <p className="text-destructive text-sm mt-1">
              {errors.localizacao}
            </p>
          )}
        </div>

        {/* Retirar tudo */}
        <label
          className={`flex items-center gap-2 text-sm text-muted-foreground ml-2 ${
            !localizacaoSelecionada || saidaMutation.isPending
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
          data-test="modal-saida-retirar-tudo-container"
        >
          <input
            type="checkbox"
            checked={retirarTudo}
            onChange={handleRetirarTudoChange}
            disabled={!localizacaoSelecionada || saidaMutation.isPending}
            className="w-4 h-4 accent-[var(--ei-accent)] cursor-pointer disabled:cursor-not-allowed"
            data-test="modal-saida-retirar-tudo-checkbox"
          />
          Retirar quantidade total
        </label>

        {/* Mensagem de erro da API */}
        {saidaMutation.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            <div className="font-medium mb-1">
              Não foi possível registrar a saída
            </div>
            <div className="text-destructive/80">
              {(saidaMutation.error as any)?.response?.data?.message ||
                (saidaMutation.error as any)?.message ||
                'Erro desconhecido'}
            </div>
          </div>
        )}
      </div>

      {/* Footer com ações */}
      <div
        className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md"
        data-test="modal-saida-footer"
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saidaMutation.isPending}
            className="h-11 flex-1 cursor-pointer"
            data-test="modal-saida-cancelar"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saidaMutation.isPending}
            className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="modal-saida-confirmar"
          >
            {saidaMutation.isPending ? 'Registrando...' : 'Registrar'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return (
    <>
      {typeof window !== 'undefined' &&
        createPortal(modalContent, document.body)}
      {localizacaoToEdit && (
        <>
          <ModalEditarLocalizacao
            isOpen={isEditarLocalizacaoModalOpen}
            onClose={() => {
              setIsEditarLocalizacaoModalOpen(false);
              setLocalizacaoToEdit(null);
            }}
            localizacaoId={localizacaoToEdit._id}
            localizacaoNome={localizacaoToEdit.nome}
            localizacaoDescricao={localizacaoToEdit.descricao}
            onSuccess={onClose}
          />
          <ModalExcluirLocalizacao
            isOpen={isExcluirLocalizacaoModalOpen}
            onClose={() => {
              setIsExcluirLocalizacaoModalOpen(false);
              setLocalizacaoToEdit(null);
            }}
            localizacaoId={localizacaoToEdit._id}
            localizacaoNome={localizacaoToEdit.nome}
            onSuccess={onClose}
          />
        </>
      )}
    </>
  );
}
