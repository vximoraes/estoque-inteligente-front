'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/fetchData';
import { Button } from '@/components/ui/button';
import { ModalShell } from '@/components/ui/modal-shell';
import { toast } from 'react-toastify';
import { ItemConsumoApiResponse } from '@/types/itens';

interface Localizacao {
  _id: string;
  nome: string;
}

interface EstoqueData {
  _id: string;
  localizacao: Localizacao;
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

interface EmprestimoRequest {
  item: string;
  localizacao: string;
  quantidade_emprestada: string;
  solicitante_nome: string;
  solicitante_email?: string;
  data_prevista_devolucao?: string;
  observacoes_emprestimo?: string;
}

interface ModalCadastrarEmprestimoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ModalCadastrarEmprestimo({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastrarEmprestimoProps) {
  const queryClient = useQueryClient();

  const [itemSelecionado, setItemSelecionado] = useState<{
    _id: string;
    nome: string;
  } | null>(null);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemPesquisa, setItemPesquisa] = useState('');

  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState('');
  const [isLocalizacaoDropdownOpen, setIsLocalizacaoDropdownOpen] =
    useState(false);
  const [localizacaoPesquisa, setLocalizacaoPesquisa] = useState('');

  const [quantidade, setQuantidade] = useState('');
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [errors, setErrors] = useState<{
    item?: string;
    localizacao?: string;
    quantidade?: string;
    solicitanteNome?: string;
    solicitanteEmail?: string;
    dataPrevista?: string;
  }>({});

  const resetForm = () => {
    setItemSelecionado(null);
    setItemPesquisa('');
    setIsItemDropdownOpen(false);
    setLocalizacaoSelecionada('');
    setLocalizacaoPesquisa('');
    setIsLocalizacaoDropdownOpen(false);
    setQuantidade('');
    setSolicitanteNome('');
    setSolicitanteEmail('');
    setDataPrevista('');
    setObservacoes('');
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
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
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-item-dropdown]')) {
        setIsItemDropdownOpen(false);
      }
      if (!target.closest('[data-localizacao-dropdown]')) {
        setIsLocalizacaoDropdownOpen(false);
      }
    };
    if (isOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Só consumo: este fluxo empresta por quantidade e depois busca
  // `/estoques/item/:id`, que não existe para item permanente (unidades
  // patrimoniais emprestam por `modal-emprestar-unidade.tsx`).
  const { data: itensData, isLoading: isLoadingItens } =
    useQuery<ItemConsumoApiResponse>({
      queryKey: ['itens-dropdown-emprestimo', itemPesquisa],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (itemPesquisa) params.append('nome', itemPesquisa);
        params.append('tipo', 'consumo');
        params.append('limite', '20');
        return await get<ItemConsumoApiResponse>(`/itens?${params.toString()}`);
      },
      enabled: isOpen,
    });

  const { data: estoquesData, isLoading: isLoadingLocalizacoes } =
    useQuery<EstoqueApiResponse>({
      queryKey: ['estoques', itemSelecionado?._id],
      queryFn: async () => {
        return await get<EstoqueApiResponse>(
          `/estoques/item/${itemSelecionado?._id}`,
        );
      },
      enabled: isOpen && !!itemSelecionado,
    });

  const estoques = estoquesData?.data?.docs || [];
  const localizacoesDisponiveis = estoques
    .filter((e) => e.quantidade > 0)
    .map((e) => e.localizacao);
  const localizacoesFiltradas = localizacoesDisponiveis.filter((loc) =>
    loc.nome.toLowerCase().includes(localizacaoPesquisa.toLowerCase()),
  );
  const localizacaoSelecionadaObj = localizacoesDisponiveis.find(
    (loc) => loc._id === localizacaoSelecionada,
  );

  const getQuantidadeDisponivel = (localizacaoId: string): number => {
    const estoque = estoques.find((e) => e.localizacao._id === localizacaoId);
    return estoque?.quantidade || 0;
  };

  const itens = itensData?.data?.docs || [];

  const criarMutation = useMutation({
    mutationFn: async (data: EmprestimoRequest) => {
      return await post('/emprestimos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      toast.success('Empréstimo registrado com sucesso!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const msg =
        error?.errors?.[0]?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Erro ao registrar empréstimo.';
      toast.error(msg, { position: 'bottom-right', autoClose: 5000 });
    },
  });

  const handleItemSelect = (item: { _id: string; nome: string }) => {
    setItemSelecionado(item);
    setIsItemDropdownOpen(false);
    setItemPesquisa('');
    setLocalizacaoSelecionada('');
    if (errors.item) setErrors((prev) => ({ ...prev, item: undefined }));
  };

  const handleLocalizacaoSelect = (localizacao: Localizacao) => {
    setLocalizacaoSelecionada(localizacao._id);
    setIsLocalizacaoDropdownOpen(false);
    setLocalizacaoPesquisa('');
    if (errors.localizacao) {
      setErrors((prev) => ({ ...prev, localizacao: undefined }));
    }
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

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!itemSelecionado) {
      newErrors.item = 'Selecione um item';
    }

    if (!localizacaoSelecionada) {
      newErrors.localizacao = 'Selecione uma localização';
    }

    if (!quantidade || quantidade === '0') {
      newErrors.quantidade = 'Quantidade deve ser maior que 0';
    } else if (
      localizacaoSelecionada &&
      Number(quantidade) > getQuantidadeDisponivel(localizacaoSelecionada)
    ) {
      newErrors.quantidade = 'Quantidade maior que a disponível em estoque';
    }

    if (solicitanteNome.trim().length < 3) {
      newErrors.solicitanteNome =
        'Nome do solicitante deve ter no mínimo 3 caracteres';
    }

    if (solicitanteEmail.trim() && !/^\S+@\S+\.\S+$/.test(solicitanteEmail)) {
      newErrors.solicitanteEmail = 'E-mail inválido';
    }

    if (dataPrevista && new Date(dataPrevista) <= new Date()) {
      newErrors.dataPrevista = 'A data prevista deve ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const data: EmprestimoRequest = {
      item: itemSelecionado!._id,
      localizacao: localizacaoSelecionada,
      quantidade_emprestada: quantidade.trim(),
      solicitante_nome: solicitanteNome.trim(),
    };

    if (solicitanteEmail.trim()) {
      data.solicitante_email = solicitanteEmail.trim();
    }
    if (dataPrevista) {
      data.data_prevista_devolucao = dataPrevista;
    }
    if (observacoes.trim()) {
      data.observacoes_emprestimo = observacoes.trim();
    }

    criarMutation.mutate(data);
  };

  const isPending = criarMutation.isPending;

  const modalContent = (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      data-test="modal-cadastrar-emprestimo"
      zIndex={99999}
      contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-6 pb-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          title="Fechar"
          data-test="modal-cadastrar-emprestimo-close"
        >
          <X size={20} />
        </button>
        <div className="text-center pt-4 px-8">
          <h2 className="text-xl font-semibold text-foreground">
            Adicionar empréstimo
          </h2>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Item */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Item <span className="text-destructive">*</span>
          </label>
          <div className="relative" data-item-dropdown>
            <button
              type="button"
              onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
              className={`w-full h-11 flex items-center justify-between px-3 bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 transition-colors cursor-pointer ${
                errors.item ? 'border-destructive' : 'border-border'
              }`}
              data-test="modal-cadastrar-emprestimo-item-dropdown"
            >
              <span
                className={`truncate ${itemSelecionado ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {itemSelecionado?.nome || 'Selecione um item'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                  isItemDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isItemDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-border bg-muted/50">
                  <input
                    type="text"
                    placeholder="Pesquisar item..."
                    value={itemPesquisa}
                    onChange={(e) => setItemPesquisa(e.target.value)}
                    className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
                    onClick={(e) => e.stopPropagation()}
                    data-test="modal-cadastrar-emprestimo-item-pesquisa"
                  />
                </div>
                <div className="overflow-y-auto">
                  {isLoadingItens ? (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                      Carregando...
                    </div>
                  ) : itens.length > 0 ? (
                    itens.map((item) => (
                      <button
                        type="button"
                        key={item._id}
                        onClick={() =>
                          handleItemSelect({
                            _id: item._id,
                            nome: item.nome,
                          })
                        }
                        className={`w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer truncate ${
                          itemSelecionado?._id === item._id
                            ? 'bg-[var(--ei-accent)]/5 text-[var(--ei-accent)] font-medium'
                            : 'text-foreground'
                        }`}
                        title={item.nome}
                        data-test="modal-cadastrar-emprestimo-item-opcao"
                      >
                        {item.nome}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                      Nenhum item encontrado
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.item && (
            <p className="text-destructive text-sm mt-1">{errors.item}</p>
          )}
        </div>

        {/* Localização */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Localização <span className="text-destructive">*</span>
          </label>
          <div className="relative" data-localizacao-dropdown>
            <button
              type="button"
              onClick={() =>
                setIsLocalizacaoDropdownOpen(!isLocalizacaoDropdownOpen)
              }
              disabled={!itemSelecionado || isLoadingLocalizacoes}
              className={`w-full h-11 flex items-center justify-between px-3 bg-background border rounded-md hover:border-border focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                errors.localizacao ? 'border-destructive' : 'border-border'
              }`}
              data-test="modal-cadastrar-emprestimo-localizacao-dropdown"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className={`truncate ${localizacaoSelecionadaObj ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {!itemSelecionado
                    ? 'Selecione um item primeiro'
                    : isLoadingLocalizacoes
                      ? 'Carregando...'
                      : localizacaoSelecionadaObj?.nome ||
                        'Selecionar localização'}
                </span>
                {localizacaoSelecionada && (
                  <span className="text-xs px-2 py-0.5 rounded-md shrink-0 bg-muted/50 text-foreground whitespace-nowrap">
                    {getQuantidadeDisponivel(localizacaoSelecionada)} disponível
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2 ${
                  isLocalizacaoDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isLocalizacaoDropdownOpen && !isLoadingLocalizacoes && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-border bg-muted/50">
                  <input
                    type="text"
                    placeholder="Pesquisar localização..."
                    value={localizacaoPesquisa}
                    onChange={(e) => setLocalizacaoPesquisa(e.target.value)}
                    className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
                    onClick={(e) => e.stopPropagation()}
                    data-test="modal-cadastrar-emprestimo-localizacao-pesquisa"
                  />
                </div>
                <div className="overflow-y-auto">
                  {localizacoesFiltradas.length > 0 ? (
                    localizacoesFiltradas.map((localizacao) => (
                      <button
                        type="button"
                        key={localizacao._id}
                        onClick={() => handleLocalizacaoSelect(localizacao)}
                        className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer ${
                          localizacaoSelecionada === localizacao._id
                            ? 'bg-[var(--ei-accent)]/5 text-[var(--ei-accent)] font-medium'
                            : 'text-foreground'
                        }`}
                        data-test="modal-cadastrar-emprestimo-localizacao-opcao"
                      >
                        <span className="truncate">{localizacao.nome}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md shrink-0 bg-muted/50 text-foreground">
                          {getQuantidadeDisponivel(localizacao._id)} disponível
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                      Nenhuma localização com estoque disponível
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

        {/* Quantidade */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Quantidade <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Digite a quantidade"
            value={quantidade}
            onChange={handleQuantidadeChange}
            maxLength={9}
            className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 ${
              errors.quantidade ? 'border-destructive' : 'border-border'
            }`}
            data-test="modal-cadastrar-emprestimo-quantidade"
          />
          {errors.quantidade && (
            <p className="text-destructive text-sm mt-1">{errors.quantidade}</p>
          )}
        </div>

        {/* Solicitante */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Solicitante <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Nome do solicitante"
            value={solicitanteNome}
            onChange={(e) => {
              setSolicitanteNome(e.target.value);
              if (errors.solicitanteNome) {
                setErrors((prev) => ({
                  ...prev,
                  solicitanteNome: undefined,
                }));
              }
            }}
            maxLength={120}
            className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 ${
              errors.solicitanteNome ? 'border-destructive' : 'border-border'
            }`}
            data-test="modal-cadastrar-emprestimo-solicitante"
          />
          {errors.solicitanteNome && (
            <p className="text-destructive text-sm mt-1">
              {errors.solicitanteNome}
            </p>
          )}
        </div>

        {/* E-mail do solicitante */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            E-mail do solicitante
          </label>
          <input
            type="email"
            placeholder="email@exemplo.com"
            value={solicitanteEmail}
            onChange={(e) => {
              setSolicitanteEmail(e.target.value);
              if (errors.solicitanteEmail) {
                setErrors((prev) => ({
                  ...prev,
                  solicitanteEmail: undefined,
                }));
              }
            }}
            className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 ${
              errors.solicitanteEmail ? 'border-destructive' : 'border-border'
            }`}
            data-test="modal-cadastrar-emprestimo-email"
          />
          {errors.solicitanteEmail && (
            <p className="text-destructive text-sm mt-1">
              {errors.solicitanteEmail}
            </p>
          )}
        </div>

        {/* Data prevista */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Data prevista de devolução
          </label>
          <input
            type="datetime-local"
            value={dataPrevista}
            onChange={(e) => {
              setDataPrevista(e.target.value);
              if (errors.dataPrevista) {
                setErrors((prev) => ({ ...prev, dataPrevista: undefined }));
              }
            }}
            className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 ${
              errors.dataPrevista ? 'border-destructive' : 'border-border'
            }`}
            data-test="modal-cadastrar-emprestimo-data-prevista"
          />
          {errors.dataPrevista && (
            <p className="text-destructive text-sm mt-1">
              {errors.dataPrevista}
            </p>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50"
            placeholder="Observações opcionais"
            data-test="modal-cadastrar-emprestimo-observacoes"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/20 rounded-b-md">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="h-11 flex-1 cursor-pointer"
            data-test="modal-cadastrar-emprestimo-cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="h-11 flex-1 text-ei-accent-foreground hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--ei-accent)' }}
            data-test="modal-cadastrar-emprestimo-salvar"
          >
            {isPending ? 'Registrando...' : 'Registrar'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
