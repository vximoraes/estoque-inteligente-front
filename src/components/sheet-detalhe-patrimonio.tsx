'use client';

// Detalhe de uma unidade patrimonial: dados de cadastro, campos
// personalizados e histórico completo (ledger imutável via
// `GET /patrimonios/:id/eventos`). Substitui o antigo drawer de unidades +
// drawer de histórico em dois níveis — agora a unidade já é o card
// clicado, então o detalhe abre direto num só Sheet.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { get } from '@/lib/fetchData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import StatusBadge from '@/components/status-badge';
import type {
  PatrimonioData,
  PatrimonioEventoApiResponse,
  PatrimonioEventoData,
  PatrimonioEventoTipo,
} from '@/types/patrimonios';

interface SheetDetalhePatrimonioProps {
  patrimonio: PatrimonioData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_LABEL: Record<PatrimonioEventoTipo, string> = {
  cadastro: 'Cadastro',
  emprestimo: 'Empréstimo',
  devolucao: 'Devolução',
  manutencao_entrada: 'Enviado p/ manutenção',
  manutencao_saida: 'Retornou da manutenção',
  transferencia: 'Transferência',
  baixa: 'Baixa',
  reativacao: 'Reativação',
};

function formatarData(data?: string) {
  if (!data) return '—';
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

function formatarDataCompleta(data: string) {
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nomeUsuario(usuario: PatrimonioEventoData['usuario']) {
  return typeof usuario === 'string' ? '—' : usuario.nome;
}

export default function SheetDetalhePatrimonio({
  patrimonio,
  open,
  onOpenChange,
}: SheetDetalhePatrimonioProps) {
  const [eventoSelecionado, setEventoSelecionado] =
    useState<PatrimonioEventoData | null>(null);
  const [modalEventoAberto, setModalEventoAberto] = useState(false);

  const { data, isLoading } = useQuery<PatrimonioEventoApiResponse>({
    queryKey: ['patrimonio-eventos', patrimonio?._id],
    queryFn: () =>
      get<PatrimonioEventoApiResponse>(
        `/patrimonios/${patrimonio?._id}/eventos?limite=50`,
      ),
    enabled: !!patrimonio?._id && open,
  });

  const eventos = data?.data?.docs ?? [];
  const campos = patrimonio?.campos_personalizados ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg"
        data-test="sheet-detalhe-patrimonio"
      >
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            <SheetTitle data-test="sheet-detalhe-titulo">
              {patrimonio?.numero_patrimonio}
            </SheetTitle>
            {patrimonio && <StatusBadge status={patrimonio.status} size="sm" />}
          </div>
          <SheetDescription data-test="sheet-detalhe-item-nome">
            {patrimonio?.modelo || patrimonio?.categoria.nome}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 flex-1 overflow-y-auto pb-4">
          <div data-test="sheet-detalhe-dados">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2 mb-3 border-b border-border">
              Dados
            </h4>
            <dl className="space-y-3">
              {patrimonio?.modelo && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Modelo
                  </dt>
                  <dd className="text-sm text-foreground break-words">
                    {patrimonio.modelo}
                  </dd>
                </div>
              )}
              {patrimonio?.fabricante && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Fabricante
                  </dt>
                  <dd className="text-sm text-foreground break-words">
                    {patrimonio.fabricante}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Categoria
                </dt>
                <dd className="text-sm text-foreground break-words">
                  {patrimonio?.categoria.nome ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Localização
                </dt>
                <dd className="text-sm text-foreground break-words">
                  {patrimonio?.localizacao?.nome ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Aquisição
                </dt>
                <dd className="text-sm text-foreground">
                  {formatarData(patrimonio?.data_aquisicao)}
                </dd>
              </div>
              {patrimonio?.observacoes && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Observações
                  </dt>
                  <dd className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {patrimonio.observacoes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {campos.length > 0 && (
            <div data-test="sheet-detalhe-campos-personalizados">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2 mb-3 border-b border-border">
                Campos personalizados
              </h4>
              <dl className="space-y-3">
                {campos.map((campo, index) => (
                  <div key={index}>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 truncate">
                      {campo.chave}
                    </dt>
                    <dd className="text-sm text-foreground break-words">
                      {campo.valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2 mb-3 border-b border-border">
              Histórico
            </h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Carregando...
              </p>
            ) : eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum evento registrado.
              </p>
            ) : (
              <Table data-test="sheet-detalhe-historico-tabela">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((evento) => (
                    <TableRow
                      key={evento._id}
                      onClick={() => {
                        setEventoSelecionado(evento);
                        setModalEventoAberto(true);
                      }}
                      className="h-12 cursor-pointer"
                      title="Ver detalhe do evento"
                      data-test="sheet-detalhe-historico-linha"
                    >
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatarDataCompleta(evento.data_hora)}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {TIPO_LABEL[evento.tipo]}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ChevronRight size={16} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </SheetContent>

      <Dialog open={modalEventoAberto} onOpenChange={setModalEventoAberto}>
        <DialogContent data-test="modal-evento-historico">
          {eventoSelecionado && (
            <>
              <DialogHeader>
                <DialogTitle>{TIPO_LABEL[eventoSelecionado.tipo]}</DialogTitle>
                <DialogDescription>
                  {formatarDataCompleta(eventoSelecionado.data_hora)}
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-4">
                {eventoSelecionado.localizacao_anterior &&
                  eventoSelecionado.localizacao_nova && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Localização
                      </p>
                      <p className="text-sm text-foreground">
                        {eventoSelecionado.localizacao_anterior.nome} →{' '}
                        {eventoSelecionado.localizacao_nova.nome}
                      </p>
                    </div>
                  )}

                {eventoSelecionado.observacoes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Observações
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {eventoSelecionado.observacoes}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Usuário
                  </p>
                  <p className="text-sm text-foreground">
                    {nomeUsuario(eventoSelecionado.usuario)}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
