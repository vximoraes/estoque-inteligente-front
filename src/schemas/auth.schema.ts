import { z } from 'zod';

const senhaRegex =
  /^(?=.*[?@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-zA-Z])[?@!#$%^&*()/\\a-zA-Z0-9]+$/;
const nomeRegex =
  /^([A-ZÀ-Ö][a-zà-öø-ÿ]{1,})( ((de|da|do|das|dos)|[A-ZÀ-Ö][a-zà-öø-ÿ]{1,}))*$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O campo e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  senha: z
    .string()
    .min(1, 'O campo senha é obrigatório')
    .min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const cadastroSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'O campo nome é obrigatório')
      .regex(
        nomeRegex,
        'O nome não pode ter caracteres especiais, nem números e somente ter letras maiúsculas no começo de cada nome/sobrenome, possuindo ao menos 2 letras',
      ),
    email: z
      .string()
      .min(1, 'O campo e-mail é obrigatório')
      .email('Formato de e-mail inválido'),
    senha: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(
        senhaRegex,
        'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
      ),
    confirmarSenha: z.string().min(1, 'Por favor, confirme sua senha'),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type CadastroFormData = z.infer<typeof cadastroSchema>;

export const esqueciSenhaSchema = z.object({
  email: z
    .string()
    .min(1, 'O campo e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
});

export type EsqueciSenhaFormData = z.infer<typeof esqueciSenhaSchema>;

export const redefinirSenhaSchema = z
  .object({
    senha: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(
        senhaRegex,
        'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
      ),
    confirmarSenha: z.string().min(1, 'Por favor, confirme sua senha'),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type RedefinirSenhaFormData = z.infer<typeof redefinirSenhaSchema>;

export const ativarContaSchema = z
  .object({
    senha: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(
        senhaRegex,
        'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
      ),
    confirmarSenha: z.string().min(1, 'Por favor, confirme sua senha'),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

export type AtivarContaFormData = z.infer<typeof ativarContaSchema>;
