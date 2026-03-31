'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      const result = await signIn('credentials', {
        email: data.email,
        senha: data.senha,
        redirect: false,
      });

      if (result?.error) {
        setError('E-mail ou senha incorretos.');
      } else if (result?.ok) {
        router.push('/itens');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#efefef]">
      <div className="grid min-h-screen w-full overflow-hidden bg-white md:grid-cols-2">

        {/* ─── Painel Esquerdo ─── */}
        <div
          className="relative hidden overflow-hidden md:my-6 md:ml-6 md:mr-0 md:flex md:min-h-[calc(100vh-3rem)] md:self-center md:rounded-[28px]"
        >
          {/* Imagem de fundo com zoom responsivo */}
          <img
            src="/aurora-gradient-1774906689788.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover scale-150"
            style={{ transformOrigin: 'center center', filter: 'contrast(1.2) brightness(0.90) saturate(0.7)' }}
          />
          {/* Conteúdo */}
          <div className="relative z-10 flex w-full flex-col items-center justify-center p-10 text-white gap-8">
            {/* Tagline */}
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium tracking-widest text-white/50">Powered by AI</p>
              <h2 className="text-3xl font-semibold leading-tight text-white">
                Gestão de estoque inteligente,<br />com decisões guiadas por IA.
              </h2>
            </div>

            {/* Feature cards */}
            <div className="flex flex-col gap-2.5 w-fit">
              <div className="group flex items-center gap-4 rounded-2xl bg-white/8 backdrop-blur-sm px-5 py-3 transition-all duration-300 hover:bg-white/15 cursor-default">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#1d3a72]">1</span>
                <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">Controle de entradas e saídas em tempo real</span>
              </div>
              <div className="group flex items-center gap-4 rounded-2xl bg-white/8 backdrop-blur-sm px-5 py-3 transition-all duration-300 hover:bg-white/15 cursor-default">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#1d3a72]">2</span>
                <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">Insights e alertas gerados por inteligência artificial</span>
              </div>
              <div className="group flex items-center gap-4 rounded-2xl bg-white/8 backdrop-blur-sm px-5 py-3 transition-all duration-300 hover:bg-white/15 cursor-default">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white transition-all duration-300 group-hover:bg-white group-hover:text-[#1d3a72]">3</span>
                <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">Relatórios detalhados e exportação de dados</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <img
              src="/estoque-inteligente-logo.png"
              alt="Estoque Inteligente"
              className="mb-6 h-12 w-12 object-contain md:hidden"
            />

            <div className="mb-7">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                Entrar na plataforma
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Use seu e-mail e senha para acessar sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label className="pb-2 text-sm text-zinc-800" htmlFor="email">
                  E-mail<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-12 w-full rounded-xl border-zinc-200 bg-zinc-50 px-4 text-sm"
                  type="email"
                  id="email"
                  placeholder="Insira seu endereço de e-mail"
                  {...register('email')}
                  disabled={isSubmitting}
                  data-test="email-input"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="pt-4">
                <Label className="pb-2 text-sm text-zinc-800" htmlFor="senha">
                  Senha<span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    className="h-12 w-full rounded-xl border-zinc-200 bg-zinc-50 px-4 pr-12 text-sm"
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    placeholder="Insira sua senha"
                    {...register('senha')}
                    disabled={isSubmitting}
                    data-test="senha-input"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <img src="/eye.png" alt="" className="h-5 w-5 opacity-70" />
                    ) : (
                      <img src="/eye-off.png" alt="" className="h-5 w-5 opacity-70" />
                    )}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1 text-sm text-red-500">{errors.senha.message}</p>
                )}
              </div>

              <Link
                href="/esqueci-senha"
                className="mt-3 inline-block text-sm text-zinc-600 underline transition-colors hover:text-zinc-900"
              >
                Esqueci minha senha
              </Link>

              {error && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#0f1419] hover:bg-[#1a2330] text-sm font-semibold text-white transition-colors duration-500 cursor-pointer"
                  disabled={isSubmitting}
                  data-test="botao-entrar"
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
