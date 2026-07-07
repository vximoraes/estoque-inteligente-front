'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLeftPanel from '@/components/auth-left-panel';
import { loginSchema, type LoginFormData } from '@/schemas';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.senha,
        fetchOptions: { credentials: 'include' },
      });

      if (error) {
        setError('E-mail ou senha incorretos.');
      } else {
        router.push('/itens');
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  return (
    <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
      <AuthLeftPanel />

      <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-[1.625rem] font-semibold leading-tight text-foreground">
              Acesso ao sistema
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Informe suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  htmlFor="email"
                >
                  E-mail
                </Label>
                <Input
                  className="h-11"
                  aria-invalid={!!errors.email}
                  type="email"
                  id="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  disabled={isSubmitting}
                  data-test="email-input"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                    htmlFor="senha"
                  >
                    Senha
                  </Label>
                  <Link
                    href="/esqueci-senha"
                    className="text-sm text-[#306FCC] transition-colors hover:text-[#2557a7]"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative w-full">
                  <Input
                    aria-invalid={!!errors.senha}
                    className="w-full h-11 pr-11"
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    placeholder="••••••••"
                    {...register('senha')}
                    disabled={isSubmitting}
                    data-test="senha-input"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-xs text-destructive">{errors.senha.message}</p>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="mt-6 h-11 w-full rounded-md bg-[#0f1419] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1a2330] cursor-pointer dark:bg-[#306FCC] dark:hover:bg-[#2557a7]"
              disabled={isSubmitting}
              data-test="botao-entrar"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
