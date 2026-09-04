'use client';

import { Suspense } from 'react';
import { useQueryState } from 'nuqs';
import Cabecalho from '@/components/layout/cabecalho';
import {
  Boxes,
  Package,
  ArrowRightLeft,
  Handshake,
  TrendingUp,
} from 'lucide-react';
import AbaAlmoxarifado from './_components/aba-almoxarifado';
import AbaPatrimonio from './_components/aba-patrimonio';
import AbaMovimentacoes from './_components/aba-movimentacoes';
import AbaEmprestimos from './_components/aba-emprestimos';
import AbaTendencia from './_components/aba-tendencia';

const ABAS = [
  { value: 'patrimonio', label: 'Patrimônio', icon: Package },
  { value: 'almoxarifado', label: 'Almoxarifado', icon: Boxes },
  { value: 'movimentacoes', label: 'Movimentações', icon: ArrowRightLeft },
  { value: 'emprestimos', label: 'Empréstimos', icon: Handshake },
  { value: 'tendencia', label: 'Tendência', icon: TrendingUp },
] as const;

type AbaValue = (typeof ABAS)[number]['value'];

const ABA_VALUES = ABAS.map((aba) => aba.value);

function isAbaValida(value: string): value is AbaValue {
  return (ABA_VALUES as string[]).includes(value);
}

function RelatoriosPageContent() {
  const [tabParam, setTabParam] = useQueryState('tab', {
    defaultValue: 'patrimonio',
  });
  const aba: AbaValue = isAbaValida(tabParam) ? tabParam : 'patrimonio';
  const abaAtual = ABAS.find((item) => item.value === aba)!;

  return (
    <div
      className="w-full max-w-full h-screen flex flex-col overflow-hidden"
      data-test="relatorios-page"
    >
      <Cabecalho pagina="Relatórios" acao={abaAtual.label} />

      <div
        className="flex gap-1 shrink-0 border-b border-border px-6 overflow-x-auto overflow-y-hidden"
        data-test="relatorios-tabs"
      >
        {ABAS.map((item) => {
          const Icon = item.icon;
          const ativo = item.value === aba;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTabParam(item.value)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
                ativo
                  ? 'border-[var(--ei-accent)] text-[var(--ei-accent)]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-test={`relatorios-tab-${item.value}`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {aba === 'almoxarifado' && <AbaAlmoxarifado />}
      {aba === 'patrimonio' && <AbaPatrimonio />}
      {aba === 'movimentacoes' && <AbaMovimentacoes />}
      {aba === 'emprestimos' && <AbaEmprestimos />}
      {aba === 'tendencia' && <AbaTendencia />}
    </div>
  );
}

export default function RelatoriosPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)]/15"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[var(--ei-accent)] border-r-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground font-medium">
            Carregando...
          </p>
        </div>
      }
    >
      <RelatoriosPageContent />
    </Suspense>
  );
}
