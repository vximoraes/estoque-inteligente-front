'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff } from 'lucide-react';
import AuthLeftPanel from '@/components/auth-left-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cadastroSchema, type CadastroFormData } from '@/schemas';

interface PasswordRequirement {
  text: string;
  regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { text: 'Mínimo de 8 caracteres', regex: /.{8,}/ },
  { text: 'Uma letra maiúscula', regex: /[A-Z]/ },
  { text: 'Uma letra minúscula', regex: /[a-z]/ },
  { text: 'Um número', regex: /\d/ },
  {
    text: 'Um caractere especial (@, #, $, %, etc.)',
    regex: /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  },
];

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
  });

  const senhaAtual = watch('senha', '');

  const checkPasswordRequirement = (
    requirement: PasswordRequirement,
  ): boolean => {
    return requirement.regex.test(senhaAtual);
  };

  const onSubmit = async (data: CadastroFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          senha: data.senha,
        }),
      });
      const responseData = await res.json();
      if (!res.ok) throw responseData;

      if (responseData.error === false) {
        toast.success(
          'Conta criada com sucesso! Redirecionando para o login...',
          {
            position: 'bottom-right',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            transition: Slide,
          },
        );

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        const errorData = error as {
          message?: string;
          errors?: Array<{ path: string; message: string }>;
        };

        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: { path: string; message: string }) => {
            setError(err.path as keyof CadastroFormData, {
              type: 'server',
              message: err.message,
            });
          });
        }

        toast.error(
          errorData.message || 'Ocorreu um erro ao criar sua conta.',
          {
            position: 'bottom-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            transition: Slide,
          },
        );
      } else {
        toast.error('Ocorreu um erro inesperado. Tente novamente.', {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        });
      }
    }
  };

  return (
    <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
      <AuthLeftPanel />
      <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-[1.625rem] font-semibold leading-tight text-foreground">
              Criar conta
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Preencha os dados abaixo para se cadastrar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  htmlFor="nome"
                >
                  Nome completo
                </Label>
                <Input
                  className="h-11"
                  aria-invalid={!!errors.nome}
                  type="text"
                  id="nome"
                  placeholder="Seu nome completo"
                  {...register('nome')}
                  disabled={isSubmitting}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">
                    {errors.nome.message}
                  </p>
                )}
              </div>

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
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  htmlFor="senha"
                >
                  Senha
                </Label>
                <div className="relative w-full">
                  <Input
                    aria-invalid={!!errors.senha}
                    className="w-full h-11 pr-11"
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    placeholder="••••••••"
                    {...register('senha')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-xs text-destructive">
                    {errors.senha.message}
                  </p>
                )}
                {senhaAtual && (
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    {passwordRequirements.map((req, i) => {
                      const met = checkPasswordRequirement(req);
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-xs transition-colors duration-150 ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                        >
                          <div
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${met ? 'bg-emerald-500' : 'bg-border'}`}
                          />
                          {req.text}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  htmlFor="confirmarSenha"
                >
                  Confirmar senha
                </Label>
                <div className="relative w-full">
                  <Input
                    aria-invalid={!!errors.confirmarSenha}
                    className="w-full h-11 pr-11"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmarSenha"
                    placeholder="••••••••"
                    {...register('confirmarSenha')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmarSenha && (
                  <p className="text-xs text-destructive">
                    {errors.confirmarSenha.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 h-11 w-full rounded-md bg-[var(--ei-accent)] text-sm font-semibold text-ei-accent-foreground transition-colors duration-200 hover:bg-[var(--ei-accent-hover)] cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Cadastrando...' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
            Já tem uma conta?{' '}
            <button
              type="button"
              className="text-[var(--ei-accent)] transition-colors hover:text-[var(--ei-accent-hover)] cursor-pointer"
              onClick={() => router.push('/login')}
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />
    </div>
  );
}
