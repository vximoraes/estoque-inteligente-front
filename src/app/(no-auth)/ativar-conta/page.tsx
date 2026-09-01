'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff } from 'lucide-react';
import AuthLeftPanel from '@/app/(no-auth)/_components/auth-left-panel';
import GoogleIcon from '@/app/(no-auth)/_components/google-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PulseLoader } from 'react-spinners';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { ativarContaSchema, type AtivarContaFormData } from '@/schemas';

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

function AtivarContaContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AtivarContaFormData>({
    resolver: zodResolver(ativarContaSchema),
  });

  const senhaAtual = watch('senha', '');

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      toast.error('Token de convite não encontrado.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
    } else {
      setTokenValido(true);
    }
  }, [token]);

  useEffect(() => {
    if (searchParams.get('error')) {
      setGoogleError('Erro ao continuar com Google. Tente novamente.');
    }
  }, [searchParams]);

  const checkPasswordRequirement = (req: PasswordRequirement): boolean =>
    req.regex.test(senhaAtual);

  const onSubmit = async (data: AtivarContaFormData) => {
    if (!token) {
      toast.error('Token de convite inválido.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ativar-conta?token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha: data.senha }),
        },
      );
      const responseData = await res.json();
      if (!res.ok) throw responseData;

      if (responseData.error === false) {
        toast.success(
          'Conta ativada com sucesso! Redirecionando para o login...',
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
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        const errorData = error as { message?: string };
        toast.error(
          errorData.message || 'Ocorreu um erro ao ativar sua conta.',
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

  const handleGoogleContinuar = async () => {
    setGoogleLoading(true);

    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/bens/patrimonio`,
      errorCallbackURL: `${window.location.origin}/ativar-conta?token=${token}`,
    });

    if (error) {
      setGoogleError('Erro ao continuar com Google. Tente novamente.');
      setGoogleLoading(false);
    }
  };

  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PulseLoader color="var(--ei-accent)" size={15} />
      </div>
    );
  }

  if (tokenValido === false) {
    return (
      <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
        <AuthLeftPanel />
        <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-sm" data-test="token-invalido">
            <h2 className="text-[1.625rem] font-semibold leading-tight text-foreground mb-3">
              Link inválido
            </h2>
            <p className="text-sm font-medium text-muted-foreground mb-6">
              O link de convite é inválido ou expirou. Entre em contato com o
              administrador para solicitar um novo convite.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="h-11 rounded-md bg-[var(--ei-accent)] text-sm font-semibold text-ei-accent-foreground transition-colors duration-200 hover:bg-[var(--ei-accent-hover)] cursor-pointer"
            >
              Ir para acesso
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
      <AuthLeftPanel />
      <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-[1.625rem] font-semibold leading-tight text-foreground">
              Ativação de conta
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Crie uma senha segura para ativar sua conta e começar a utilizar o
              sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-5">
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
                    data-test="confirmar-senha-input"
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

            {googleError && (
              <p className="mt-4 text-sm text-destructive">{googleError}</p>
            )}

            <Button
              type="submit"
              className="mt-6 h-11 w-full rounded-md bg-[var(--ei-accent)] text-sm font-semibold text-ei-accent-foreground transition-colors duration-200 hover:bg-[var(--ei-accent-hover)] cursor-pointer"
              disabled={isSubmitting}
              data-test="botao-ativar-conta"
            >
              {isSubmitting ? 'Ativando conta...' : 'Ativar conta'}
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
            onClick={handleGoogleContinuar}
            disabled={googleLoading || isSubmitting}
            data-test="botao-google"
          >
            {!googleLoading && <GoogleIcon />}
            {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Use o mesmo e-mail para o qual o convite foi enviado.
          </p>

          <p className="mt-6 text-sm font-medium text-muted-foreground">
            Já tem uma conta ativa?{' '}
            <Link
              href="/login"
              className="text-[var(--ei-accent)] transition-colors hover:text-[var(--ei-accent-hover)]"
            >
              Acessar sistema
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AtivarContaPage() {
  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        transition={Slide}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <PulseLoader color="var(--ei-accent)" size={15} />
          </div>
        }
      >
        <AtivarContaContent />
      </Suspense>
    </>
  );
}
