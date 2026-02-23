import { z } from 'zod';

export const movimentacaoSchema = z.object({
  tipo: z.enum(['entrada', 'saida'], {
    message: 'Tipo deve ser "entrada" ou "saida"',
  }),
  item: z.string().min(1, 'O item é obrigatório'),
  quantidade: z
    .number()
    .min(1, 'A quantidade deve ser no mínimo 1')
    .max(999999999, 'A quantidade não pode exceder 999.999.999'),
  localizacao: z.string().optional(),
  observacoes: z
    .string()
    .max(500, 'As observações devem ter no máximo 500 caracteres')
    .optional(),
});

export type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;

export const entradaEstoqueSchema = z.object({
  quantidade: z
    .number()
    .min(1, 'A quantidade deve ser no mínimo 1')
    .max(999999999, 'A quantidade não pode exceder 999.999.999'),
  localizacao: z.string().optional(),
  observacoes: z
    .string()
    .max(500, 'As observações devem ter no máximo 500 caracteres')
    .optional(),
});

export type EntradaEstoqueFormData = z.infer<typeof entradaEstoqueSchema>;

export const saidaEstoqueSchema = z.object({
  quantidade: z
    .number()
    .min(1, 'A quantidade deve ser no mínimo 1')
    .max(999999999, 'A quantidade não pode exceder 999.999.999'),
  observacoes: z
    .string()
    .max(500, 'As observações devem ter no máximo 500 caracteres')
    .optional(),
});

export type SaidaEstoqueFormData = z.infer<typeof saidaEstoqueSchema>;
