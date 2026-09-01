'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff } from 'lucide-react';
import AuthLeftPanel from '@/app/(no-auth)/_components/auth-left-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PulseLoader } from 'react-spinners';
import { authClient } from '@/lib/auth-client';
import { redefinirSenhaSchema, type RedefinirSenhaFormData } from '@/schemas';

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

function RedefinirSenhaContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirSenhaFormData>({
    resolver: zodResolver(redefinirSenhaSchema),
  });

  const senhaAtual = watch('senha', '');

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      toast.error('Token de recuperação não encontrado.', {
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

  const checkPasswordRequirement = (req: PasswordRequirement): boolean =>
    req.regex.test(senhaAtual);

  const onSubmit = async (data: RedefinirSenhaFormData) => {
    if (!token) {
      toast.error('Token de recuperação inválido.', {
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

    const { error } = await authClient.resetPassword({
      newPassword: data.senha,
      token,
    });

    if (error) {
      toast.error(error.message || 'Ocorreu um erro ao redefinir sua senha.', {
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

    toast.success(
      'Senha redefinida com sucesso! Redirecionando para o login...',
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
  };

  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PulseLoader color="var(--ei-accent)" />
      </div>
    );
  }

  if (tokenValido === false) {
    return (
      <>
        <ToastContainer position="bottom-right" />
        <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
          <AuthLeftPanel />
          <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
            <div className="w-full max-w-sm" data-test="token-invalido">
              <h2 className="text-[1.625rem] font-semibold leading-tight text-foreground mb-3">
                Link inválido
              </h2>
              <p className="text-sm font-medium text-muted-foreground mb-6">
                O link de recuperação de senha é inválido ou expirou.
              </p>
              <Button
                onClick={() => router.push('/esqueci-senha')}
                className="h-11 rounded-md bg-[var(--ei-accent)] text-sm font-semibold text-ei-accent-foreground transition-colors duration-200 hover:bg-[var(--ei-accent-hover)] cursor-pointer"
              >
                Solicitar novo link
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
        <AuthLeftPanel />
        <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-[1.625rem] font-semibold leading-tight text-foreground">
                Redefinir senha
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Digite sua nova senha abaixo.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                    htmlFor="senha"
                  >
                    Nova senha
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
                    Confirmar nova senha
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
                      disabled={isSubmitting}
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
                data-test="botao-redefinir-senha"
              >
                {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <PulseLoader color="var(--ei-accent)" />
        </div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
