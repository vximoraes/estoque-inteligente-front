import { z } from 'zod';

const senhaRegex =
  /^(?=.*[?@!#$%^&*()/\\])(?=.*[0-9])(?=.*[a-zA-Z])[?@!#$%^&*()/\\a-zA-Z0-9]+$/;
const nomeRegex =
  /^([A-ZÀ-Ö][a-zà-öø-ÿ]{1,})( ((de|da|do|das|dos)|[A-ZÀ-Ö][a-zà-öø-ÿ]{1,}))*$/;

export const usuarioSchema = z.object({
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
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

export const usuarioUpdateSchema = z.object({
  nome: z
    .string()
    .min(1, 'O campo nome é obrigatório')
    .regex(
      nomeRegex,
      'O nome não pode ter caracteres especiais, nem números e somente ter letras maiúsculas no começo de cada nome/sobrenome, possuindo ao menos 2 letras',
    )
    .optional(),
  senha: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(
      senhaRegex,
      'A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial',
    )
    .optional(),
});

export type UsuarioUpdateFormData = z.infer<typeof usuarioUpdateSchema>;

export const usuarioSenhaSchema = z
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

export type UsuarioSenhaFormData = z.infer<typeof usuarioSenhaSchema>;
