'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthLeftPanel from '@/components/auth-left-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { esqueciSenhaSchema, type EsqueciSenhaFormData } from '@/schemas';

export default function EsqueciSenhaPage() {
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [emailUsuario, setEmailUsuario] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaFormData>({
    resolver: zodResolver(esqueciSenhaSchema),
  });

  const onSubmit = async (data: EsqueciSenhaFormData) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recover`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        },
      );
      const responseData = await res.json();
      if (!res.ok) throw responseData;

      if (responseData.error === false) {
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
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        const errorData = error as { message?: string };

        toast.error(
          errorData.message || 'Erro ao solicitar recuperação de senha.',
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
    <>
      <ToastContainer position="bottom-right" />
      <div className="grid min-h-screen w-full overflow-hidden bg-white md:grid-cols-2">
        <AuthLeftPanel />
        <div className="flex items-center justify-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-4 md:mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              {emailEnviado ? 'E-mail enviado!' : 'Recuperação de senha'}
            </h2>
            <p className="text-zinc-600 text-sm md:text-base mt-2">
              {emailEnviado
                ? ''
                : 'Informe o e-mail para o qual deseja redefinir sua senha.'}
            </p>
          </div>

          {!emailEnviado ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label className="pb-2 text-sm md:text-base" htmlFor="email">
                  E-mail<span className="text-red-500">*</span>
                </Label>
                <Input
                  className="p-3 md:p-5 w-full text-sm md:text-base"
                  type="email"
                  id="email"
                  placeholder="Insira seu endereço de e-mail"
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="mt-4 md:mt-6">
                <Button
                  type="submit"
                  className="p-3 md:p-5 w-full bg-[#0f1419] hover:bg-[#1a2330] transition-colors duration-500 cursor-pointer text-sm md:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="px-4 py-3">
                <p className="text-zinc-600 text-sm md:text-base text-center">
                  Um e-mail foi enviado para <strong>{emailUsuario}</strong> com
                  instruções para redefinir sua senha.
                </p>
              </div>

              <div className="text-center">
                <p className="text-zinc-600 text-sm md:text-base mb-2">
                  Não recebeu o e-mail?
                </p>
                <Button
                  onClick={() => {
                    setEmailEnviado(false);
                    setEmailUsuario('');
                  }}
                  variant="outline"
                  className="text-sm md:text-base cursor-pointer"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-zinc-600 text-sm md:text-base">
              Lembrou sua senha?{' '}
              <Link
                href="/login"
                className="text-[#306FCC] hover:text-[#2557a7] underline font-medium"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
