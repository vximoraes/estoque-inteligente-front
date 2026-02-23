'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Check, X } from 'lucide-react';
import LogoEi from '@/components/logo-ei';
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
    regex: /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/signup`,
        {
          nome: data.nome,
          email: data.email,
          senha: data.senha,
        },
      );

      if (response.data.error === false) {
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
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data;

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
    <div className="min-h-screen flex">
      <LogoEi></LogoEi>
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 md:mb-10 text-center text-2xl md:text-3xl font-bold">
            Cadastre-se!
          </h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label className="pb-2 text-sm md:text-base" htmlFor="nome">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`p-3 md:p-5 w-full text-sm md:text-base ${errors.nome ? 'border-red-500' : ''}`}
                type="text"
                id="nome"
                placeholder="Insira seu nome completo"
                {...register('nome')}
                disabled={isSubmitting}
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nome.message}
                </p>
              )}
            </div>
            <div className="pt-3 md:pt-4">
              <Label className="pb-2 text-sm md:text-base" htmlFor="email">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`p-3 md:p-5 w-full text-sm md:text-base ${errors.email ? 'border-red-500' : ''}`}
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
            <div className="pt-3 md:pt-4">
              <Label className="pb-2 text-sm md:text-base" htmlFor="senha">
                Senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className={`p-3 md:p-5 w-full pr-12 text-sm md:text-base ${errors.senha ? 'border-red-500' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  placeholder="Insira sua senha"
                  {...register('senha')}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? (
                    <img src="eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img
                      src="eye-off.png"
                      alt=""
                      className="w-5 h-5 opacity-60"
                    />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">
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
            <div className="pt-3 md:pt-4">
              <Label
                className="pb-2 text-sm md:text-base"
                htmlFor="confirmarSenha"
              >
                Confirmar senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className={`p-3 md:p-5 w-full pr-12 text-sm md:text-base ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmarSenha"
                  placeholder="Confirme sua senha"
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
                >
                  {showConfirmPassword ? (
                    <img src="eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img
                      src="eye-off.png"
                      alt=""
                      className="w-5 h-5 opacity-60"
                    />
                  )}
                </button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-red-500 text-sm mt-1">
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
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
          <p className="mt-4 md:mt-6 text-center text-sm md:text-base">
            Já tem uma conta?{' '}
            <span
              className="text-[#306FCC] hover:text-[#2557a7] underline cursor-pointer"
              onClick={() => router.push('/login')}
            >
              Entrar
            </span>
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
