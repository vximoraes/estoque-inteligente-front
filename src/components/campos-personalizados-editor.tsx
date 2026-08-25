'use client';

// Repetidor controlado de pares chave/valor — os "campos personalizados"
// de uma unidade de patrimônio (ex.: "Memória RAM: 16GB", "Número de
// série: SN12345"). Sempre texto, sem tipo especial: o valor de negócio
// está em deixar o usuário anotar o que o modelo do item não prevê, não em
// validar formato. Reaproveitado pelo cadastro e pela edição de unidade.

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { CampoPersonalizado } from '@/types/patrimonios';

const LIMITE_CAMPOS = 20;

interface CamposPersonalizadosEditorProps {
  value: CampoPersonalizado[];
  onChange: (campos: CampoPersonalizado[]) => void;
  error?: string;
  'data-test'?: string;
}

export default function CamposPersonalizadosEditor({
  value,
  onChange,
  error,
  'data-test': dataTest = 'campos-personalizados-editor',
}: CamposPersonalizadosEditorProps) {
  const chavesDuplicadas = new Set<string>();
  {
    const vistas = new Set<string>();
    for (const campo of value) {
      const chave = campo.chave.trim().toLocaleLowerCase('pt-BR');
      if (!chave) continue;
      if (vistas.has(chave)) chavesDuplicadas.add(chave);
      vistas.add(chave);
    }
  }

  const atualizarCampo = (
    index: number,
    patch: Partial<CampoPersonalizado>,
  ) => {
    onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removerCampo = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const adicionarCampo = () => {
    if (value.length >= LIMITE_CAMPOS) return;
    onChange([...value, { chave: '', valor: '' }]);
  };

  return (
    <div data-test={dataTest}>
      <div className="flex justify-between items-center mb-2">
        <Label className="text-sm font-semibold text-foreground tracking-tight">
          Campos personalizados
        </Label>
        <span className="text-xs text-muted-foreground">
          {value.length}/{LIMITE_CAMPOS}
        </span>
      </div>

      <div className="space-y-2">
        {value.map((campo, index) => {
          const chaveNormalizada = campo.chave.trim().toLocaleLowerCase('pt-BR');
          const duplicada =
            !!chaveNormalizada && chavesDuplicadas.has(chaveNormalizada);
          return (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Nome do campo (ex.: Memória RAM)"
                  value={campo.chave}
                  onChange={(e) =>
                    atualizarCampo(index, { chave: e.target.value })
                  }
                  maxLength={50}
                  className={`w-full h-11 px-3 text-base md:text-sm border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 bg-card ${
                    duplicada ? 'border-destructive' : 'border-border'
                  }`}
                  data-test="campo-personalizado-chave"
                />
                {duplicada && (
                  <p className="mt-1 text-xs text-destructive">
                    Campo duplicado
                  </p>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Valor (ex.: 16GB)"
                  value={campo.valor}
                  onChange={(e) =>
                    atualizarCampo(index, { valor: e.target.value })
                  }
                  maxLength={200}
                  className="w-full h-11 px-3 text-base md:text-sm border border-border rounded-md outline-none focus:ring-2 focus:ring-[var(--ei-accent)]/50 bg-card"
                  data-test="campo-personalizado-valor"
                />
              </div>
              <button
                type="button"
                onClick={() => removerCampo(index)}
                className="h-11 w-11 flex items-center justify-center shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                title="Remover campo"
                data-test="campo-personalizado-remover"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      <Button
        type="button"
        variant="outline"
        onClick={adicionarCampo}
        disabled={value.length >= LIMITE_CAMPOS}
        className="mt-2 h-9 px-3 text-sm cursor-pointer"
        data-test="campo-personalizado-adicionar"
      >
        <Plus className="w-4 h-4 mr-1" />
        Adicionar campo
      </Button>
    </div>
  );
}
