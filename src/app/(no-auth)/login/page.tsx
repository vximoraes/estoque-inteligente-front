'use client';

import { Suspense, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLeftPanel from '@/components/auth-left-panel';
import GoogleIcon from '@/components/google-icon';
import { loginSchema, type LoginFormData } from '@/schemas';

const ERROS_GOOGLE: Record<string, string> = {
  'google-nao-convidado':
    'Nenhum convite encontrado para essa conta Google. Peça a um administrador para te convidar.',
};

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const erro = searchParams.get('erro');
    if (erro && ERROS_GOOGLE[erro]) {
      setError(ERROS_GOOGLE[erro]);
    }
  }, [searchParams]);

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
      let retryAfter: string | null = null;

      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.senha,
        rememberMe,
        fetchOptions: {
          credentials: 'include',
          onError: (context) => {
            retryAfter = context.response.headers.get('X-Retry-After');
          },
        },
      });

      if (error) {
        if (error.status === 429) {
          setError(
            retryAfter
              ? `Muitas tentativas. Aguarde ${retryAfter} segundos e tente novamente.`
              : 'Muitas tentativas. Aguarde alguns segundos e tente novamente.',
          );
        } else {
          setError('E-mail ou senha incorretos.');
        }
      } else {
        router.push('/itens');
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/itens',
    });

    if (error) {
      setError('Erro ao entrar com Google. Tente novamente.');
      setGoogleLoading(false);
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
                    data-test="senha-input"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    disabled={isSubmitting}
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
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 ml-2">
                <Checkbox
                  id="lembrar-me"
                  className="cursor-pointer"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isSubmitting}
                  data-test="lembrar-me-checkbox"
                />
                <Label
                  htmlFor="lembrar-me"
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  Lembrar-me
                </Label>
              </div>
              <Link
                href="/esqueci-senha"
                className="text-sm text-[#306FCC] transition-colors hover:text-[#2557a7]"
              >
                Esqueci minha senha
              </Link>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="mt-6 h-11 w-full rounded-md bg-[#0f1419] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1a2330] cursor-pointer dark:bg-[#306FCC] dark:hover:bg-[#2557a7]"
              disabled={isSubmitting}
              data-test="botao-entrar"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ou
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-2 cursor-pointer"
            onClick={handleGoogleLogin}
            disabled={googleLoading || isSubmitting}
            data-test="botao-google"
          >
            {!googleLoading && <GoogleIcon />}
            {googleLoading ? 'Redirecionando...' : 'Entrar com Google'}
          </Button>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 Estoque Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <PulseLoader color="#306FCC" size={15} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
