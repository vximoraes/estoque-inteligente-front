'use client';

import StatCard from '@/app/(auth)/relatorios/_components/stat-card';
import EmptyState from '@/components/comum/empty-state';
import FiltroPeriodo, {
  formatarISO,
  type AtalhoPeriodo,
} from '@/app/(auth)/relatorios/_components/filtro-periodo';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/fetchData';
import type {
  MovimentacaoTendenciaPonto,
  EmprestimoTendenciaPonto,
  ListaApiResponse,
} from '@/types/movimentacoes';
import { TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function ultimosMeses(n: number) {
  const fim = new Date();
  const inicio = new Date();
  inicio.setUTCMonth(inicio.getUTCMonth() - (n - 1));
  inicio.setUTCDate(1);
  return { inicio: formatarISO(inicio), fim: formatarISO(fim) };
}

const ATALHOS_TENDENCIA: AtalhoPeriodo[] = [
  { label: 'Últimos 6 meses', calcular: () => ultimosMeses(6) },
  { label: 'Últimos 12 meses', calcular: () => ultimosMeses(12) },
  { label: 'Últimos 24 meses', calcular: () => ultimosMeses(24) },
];

interface PontoCombinado {
  mes: string;
  mesLabel: string;
  entradas: number;
  saidas: number;
  emprestimos: number;
  devolucoes: number;
}

function formatarMesLabel(mes: string) {
  const [ano, mesNumero] = mes.split('-').map(Number);
  const data = new Date(Date.UTC(ano, (mesNumero ?? 1) - 1, 1));
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(data);
}

export default function AbaTendencia() {
  const periodoPadrao = ultimosMeses(12);
  const [dataInicio, setDataInicio] = useState(periodoPadrao.inicio);
  const [dataFim, setDataFim] = useState(periodoPadrao.fim);

  const { data: movimentacoesData, isLoading: isLoadingMovimentacoes } =
    useQuery({
      queryKey: ['movimentacoes-tendencia', dataInicio, dataFim],
      queryFn: async () => {
        const response = await get<
          ListaApiResponse<MovimentacaoTendenciaPonto>
        >(
          `/movimentacoes/tendencia?data_inicio=${dataInicio}&data_fim=${dataFim}`,
        );
        return response?.data ?? [];
      },
      staleTime: 30_000,
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('Falha na autenticação')) return false;
        return failureCount < 3;
      },
    });

  const { data: emprestimosData, isLoading: isLoadingEmprestimos } = useQuery({
    queryKey: ['emprestimos-tendencia', dataInicio, dataFim],
    queryFn: async () => {
      const response = await get<ListaApiResponse<EmprestimoTendenciaPonto>>(
        `/emprestimos/tendencia?data_inicio=${dataInicio}&data_fim=${dataFim}`,
      );
      return response?.data ?? [];
    },
    staleTime: 30_000,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('Falha na autenticação')) return false;
      return failureCount < 3;
    },
  });

  const isLoading = isLoadingMovimentacoes || isLoadingEmprestimos;

  const pontosPorMes = new Map<string, PontoCombinado>();
  (movimentacoesData ?? []).forEach((ponto) => {
    pontosPorMes.set(ponto.mes, {
      mes: ponto.mes,
      mesLabel: formatarMesLabel(ponto.mes),
      entradas: ponto.entradas,
      saidas: ponto.saidas,
      emprestimos: 0,
      devolucoes: 0,
    });
  });
  (emprestimosData ?? []).forEach((ponto) => {
    const existente = pontosPorMes.get(ponto.mes);
    if (existente) {
      existente.emprestimos = ponto.emprestimos;
      existente.devolucoes = ponto.devolucoes;
    } else {
      pontosPorMes.set(ponto.mes, {
        mes: ponto.mes,
        mesLabel: formatarMesLabel(ponto.mes),
        entradas: 0,
        saidas: 0,
        emprestimos: ponto.emprestimos,
        devolucoes: ponto.devolucoes,
      });
    }
  });
  const pontos = Array.from(pontosPorMes.values()).sort((a, b) =>
    a.mes.localeCompare(b.mes),
  );

  const movimentacoesNoPeriodo = pontos.reduce(
    (acc, p) => acc + p.entradas + p.saidas,
    0,
  );
  const emprestimosNoPeriodo = pontos.reduce(
    (acc, p) => acc + p.emprestimos,
    0,
  );

  const temDado = pontos.some(
    (p) => p.entradas || p.saidas || p.emprestimos || p.devolucoes,
  );

  return (
    <div
      className="flex-1 overflow-hidden flex flex-col p-6 pt-4 max-w-full"
      data-test="relatorio-tendencia-page"
    >
      <div className="shrink-0 mb-4" data-test="stats-grid">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <StatCard
            title="Movimentações no período"
            value={movimentacoesNoPeriodo}
            data-test="stat-movimentacoes-periodo"
          />
          <StatCard
            title="Empréstimos no período"
            value={emprestimosNoPeriodo}
            data-test="stat-emprestimos-periodo"
          />
        </div>
      </div>

      <div className="shrink-0 mb-4" data-test="tendencia-controls">
        <FiltroPeriodo
          dataInicio={dataInicio}
          dataFim={dataFim}
          onChange={(inicio, fim) => {
            setDataInicio(inicio);
            setDataFim(fim);
          }}
          atalhos={ATALHOS_TENDENCIA}
        />
      </div>

      <div
        className="flex-1 min-h-0 border border-border rounded-md bg-card p-4"
        data-test="tendencia-chart-container"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-muted-foreground font-medium">
              Carregando tendência...
            </p>
          </div>
        ) : !temDado ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={TrendingUp}
              title="Sem dados nesse período"
              subtitle="Amplie o período para ver a evolução mensal."
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={pontos}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="mesLabel"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--popover-foreground)',
                  fontSize: 13,
                }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: 'var(--muted-foreground)',
                }}
              />
              <Line
                type="linear"
                dataKey="entradas"
                name="Entradas"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
                data-test="linha-entradas"
              />
              <Line
                type="linear"
                dataKey="saidas"
                name="Saídas"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
                data-test="linha-saidas"
              />
              <Line
                type="linear"
                dataKey="emprestimos"
                name="Empréstimos"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
                data-test="linha-emprestimos"
              />
              <Line
                type="linear"
                dataKey="devolucoes"
                name="Devoluções"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
                data-test="linha-devolucoes"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
