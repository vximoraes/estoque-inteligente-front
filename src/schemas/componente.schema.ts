import { z } from 'zod';

export const componenteSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  categoria: z
    .string()
    .min(1, 'A categoria é obrigatória'),
  estoqueMinimo: z
    .number()
    .min(0, 'O estoque mínimo deve ser maior ou igual a 0')
    .max(999999999, 'O estoque mínimo não pode exceder 999.999.999')
    .optional()
    .default(0),
  descricao: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .optional(),
});

export type ComponenteFormData = z.infer<typeof componenteSchema>;


export const componenteUpdateSchema = componenteSchema.partial();

export type ComponenteUpdateFormData = z.infer<typeof componenteUpdateSchema>;


export const categoriaSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .max(50, 'O nome deve ter no máximo 50 caracteres'),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;


export const localizacaoSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .max(50, 'O nome deve ter no máximo 50 caracteres'),
  descricao: z
    .string()
    .max(200, 'A descrição deve ter no máximo 200 caracteres')
    .optional(),
});

export type LocalizacaoFormData = z.infer<typeof localizacaoSchema>;
