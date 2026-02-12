import { z } from 'zod';

export const componenteOrcamentoSchema = z.object({
  componente: z
    .string()
    .min(1, 'O componente é obrigatório'),
  quantidade: z
    .number()
    .min(1, 'A quantidade deve ser no mínimo 1')
    .max(999999999, 'A quantidade não pode exceder 999.999.999'),
  precoUnitario: z
    .number()
    .min(0, 'O preço unitário deve ser maior ou igual a 0')
    .max(999999999, 'O preço unitário não pode exceder 999.999.999'),
});

export type ComponenteOrcamentoFormData = z.infer<typeof componenteOrcamentoSchema>;


export const orcamentoSchema = z.object({
  fornecedor: z
    .string()
    .min(1, 'O fornecedor é obrigatório'),
  componentes: z
    .array(componenteOrcamentoSchema)
    .min(1, 'É necessário adicionar pelo menos um componente'),
  observacoes: z
    .string()
    .max(500, 'As observações devem ter no máximo 500 caracteres')
    .optional(),
  dataValidade: z
    .string()
    .optional(),
});

export type OrcamentoFormData = z.infer<typeof orcamentoSchema>;


export const orcamentoUpdateSchema = orcamentoSchema.partial();

export type OrcamentoUpdateFormData = z.infer<typeof orcamentoUpdateSchema>;
