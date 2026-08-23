'use client';

// Drawer de histórico de uma unidade patrimonial — mesmo padrão visual do
// drawer de unidades (`sheet-unidades-item.tsx`): título + lista em
// tabela, só que aqui cada linha é um evento do ledger
// (`GET /patrimonios/:id/eventos`), não uma unidade. A tabela só mostra
// Data + Evento (as únicas colunas que sempre cabem sem cortar nada);
// clicar na linha abre um modal com o detalhe completo — sem truncar
// texto de observação, que pode ser arbitrariamente longo.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
import type {
  PatrimonioEventoApiResponse,
  PatrimonioEventoData,
  PatrimonioEventoTipo,
} from '@/types/patrimonios';

interface SheetHistoricoPatrimonioProps {
  patrimonioId: string | null;
  numeroPatrimonio?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Volta pro drawer de unidades de onde essa unidade veio, em vez de
   * fechar tudo — só existe quando há um drawer anterior pra voltar. */
  onVoltar?: () => void;
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

export default function SheetHistoricoPatrimonio({
  patrimonioId,
  numeroPatrimonio,
  open,
  onOpenChange,
  onVoltar,
}: SheetHistoricoPatrimonioProps) {
  const [eventoSelecionado, setEventoSelecionado] =
    useState<PatrimonioEventoData | null>(null);
  const [modalEventoAberto, setModalEventoAberto] = useState(false);

  const { data, isLoading } = useQuery<PatrimonioEventoApiResponse>({
    queryKey: ['patrimonio-eventos', patrimonioId],
    queryFn: () =>
      get<PatrimonioEventoApiResponse>(
        `/patrimonios/${patrimonioId}/eventos?limite=50`,
      ),
    enabled: !!patrimonioId && open,
  });

  const eventos = data?.data?.docs ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg"
        data-test="sheet-historico-patrimonio"
      >
        <SheetHeader className={onVoltar ? 'pt-14' : undefined}>
          {onVoltar && (
            <button
              onClick={onVoltar}
              className="absolute top-4 left-4 flex h-9 items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              data-test="sheet-historico-voltar"
            >
              <ArrowLeft size={14} />
              Voltar às unidades
            </button>
          )}
          <SheetTitle data-test="sheet-historico-titulo">
            {numeroPatrimonio}
          </SheetTitle>
          <SheetDescription data-test="sheet-historico-contador">
            {isLoading
              ? 'Carregando…'
              : `${eventos.length} evento${eventos.length === 1 ? '' : 's'}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Carregando...
              </p>
            ) : eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum evento registrado.
              </p>
            ) : (
              <Table data-test="sheet-historico-tabela">
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
                      data-test="sheet-historico-linha"
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

      <Dialog
        open={modalEventoAberto}
        onOpenChange={setModalEventoAberto}
      >
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
