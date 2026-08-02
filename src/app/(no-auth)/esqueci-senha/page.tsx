'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthLeftPanel from '@/components/auth-left-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { esqueciSenhaSchema, type EsqueciSenhaFormData } from '@/schemas';

export default function EsqueciSenhaPage() {
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaFormData>({
    resolver: zodResolver(esqueciSenhaSchema),
  });

  const onSubmit = async (data: EsqueciSenhaFormData) => {
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      toast.error(error.message || 'Erro ao solicitar recuperação de senha.', {
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

    setEmailUsuario(data.email);
    setEmailEnviado(true);
    toast.success('E-mail de recuperação enviado com sucesso!', {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      transition: Slide,
    });
  };

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="grid min-h-screen w-full overflow-hidden bg-background md:grid-cols-2">
        <AuthLeftPanel />
        <div className="flex items-center justify-center px-8 py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-sm">
            {!emailEnviado ? (
              <>
                <div className="mb-8">
                  <h1 className="text-[1.625rem] font-semibold leading-tight text-foreground">
                    Recuperar senha
                  </h1>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    Informe seu e-mail para receber o link de redefinição.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

                  <Button
                    type="submit"
                    className="mt-6 h-11 w-full rounded-md bg-[#0f1419] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1a2330] cursor-pointer dark:bg-[#306FCC] dark:hover:bg-[#2557a7]"
                    disabled={isSubmitting}
                    data-test="botao-enviar-link"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar link'}
                  </Button>
                </form>
              </>
            ) : (
              <div
                className="flex flex-col gap-6"
                data-test="email-enviado-confirmacao"
              >
                <div>
                  <h1 className="text-[1.625rem] font-semibold leading-tight text-foreground">
                    E-mail enviado
                  </h1>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Enviamos as instruções para{' '}
                    <span className="font-semibold text-foreground">
                      {emailUsuario}
                    </span>
                    . Verifique sua caixa de entrada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEmailEnviado(false);
                    setEmailUsuario('');
                  }}
                  className="text-sm text-[#306FCC] transition-colors hover:text-[#2557a7] cursor-pointer self-start"
                >
                  Não recebi — tentar novamente
                </button>
              </div>
            )}

            <p className="mt-8 text-sm font-medium text-muted-foreground">
              Lembrou a senha?{' '}
              <Link
                href="/login"
                className="text-[#306FCC] transition-colors hover:text-[#2557a7]"
              >
                Acessar sistema
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
