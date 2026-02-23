'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast, ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Check, X } from 'lucide-react';
import LogoEi from '@/components/logo-ei';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PulseLoader } from 'react-spinners';
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
    regex: /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
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

  const checkPasswordRequirement = (
    requirement: PasswordRequirement,
  ): boolean => {
    return requirement.regex.test(senhaAtual);
  };

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

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/redefinir-senha?token=${token}`,
        {
          senha: data.senha,
        },
      );

      if (response.data.error === false) {
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

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;

        toast.error(
          errorData.message || 'Ocorreu um erro ao redefinir sua senha.',
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

  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PulseLoader color="#306FCC" />
      </div>
    );
  }

  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex">
        <ToastContainer />
        <LogoEi />
        <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Token Inválido
            </h2>
            <p className="text-zinc-600 mb-6 text-sm md:text-base">
              O link de recuperação de senha é inválido ou expirou.
            </p>
            <Button
              onClick={() => router.push('/esqueci-senha')}
              className="bg-[#306FCC] hover:bg-[#2557a7] text-sm md:text-base"
            >
              Solicitar Novo Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <ToastContainer />
      <LogoEi />
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              Redefinir senha
            </h2>
            <p className="text-zinc-600 text-sm md:text-base">
              Digite sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label className="pb-2 text-sm md:text-base" htmlFor="senha">
                Nova senha<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className={`p-3 md:p-5 w-full pr-12 text-sm md:text-base ${errors.senha ? 'border-red-500' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  placeholder="Digite sua nova senha"
                  {...register('senha')}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <img src="/eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img
                      src="/eye-off.png"
                      alt=""
                      className="w-5 h-5 opacity-60"
                    />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-xs md:text-sm mt-1">
                  {errors.senha.message}
                </p>
              )}

              {/* Validação visual da senha em tempo real */}
              {senhaAtual && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <ul className="space-y-1.5">
                    {passwordRequirements.map((requirement, index) => {
                      const isValid = checkPasswordRequirement(requirement);
                      return (
                        <li
                          key={index}
                          className={`text-sm flex items-center gap-2 transition-colors duration-200 ${
                            isValid ? 'text-green-600' : 'text-gray-600'
                          }`}
                        >
                          {isValid ? (
                            <Check className="flex-shrink-0 w-4 h-4" />
                          ) : (
                            <X className="flex-shrink-0 w-4 h-4" />
                          )}
                          <span>{requirement.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-3 md:mt-4">
              <Label
                className="pb-2 text-sm md:text-base"
                htmlFor="confirmarSenha"
              >
                Confirmar nova senha<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className={`p-3 md:p-5 w-full pr-12 text-sm md:text-base ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmarSenha"
                  placeholder="Confirme sua nova senha"
                  {...register('confirmarSenha')}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                  }
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <img src="/eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img
                      src="/eye-off.png"
                      alt=""
                      className="w-5 h-5 opacity-60"
                    />
                  )}
                </button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-red-500 text-xs md:text-sm mt-1">
                  {errors.confirmarSenha.message}
                </p>
              )}
            </div>

            <div className="mt-4 md:mt-6">
              <Button
                type="submit"
                className="p-3 md:p-5 w-full bg-[#306FCC] hover:bg-[#2557a7] transition-colors duration-500 cursor-pointer text-sm md:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <PulseLoader color="#306FCC" />
        </div>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
