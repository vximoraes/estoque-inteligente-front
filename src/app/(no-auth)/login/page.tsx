"use client"

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LogoEi from "@/components/logo-ei";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormData } from "@/schemas";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        senha: data.senha,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos.");
      } else if (result?.ok) {
        router.push("/componentes");
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex">
      <LogoEi></LogoEi>
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Bem-vindo ao Estoque Inteligente!</h2>
          </div>
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
                {...register("email")}
                disabled={isSubmitting}
                data-test="email-input"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div className="pt-3 md:pt-4">
              <Label className="pb-2 text-sm md:text-base" htmlFor="senha">
                Senha<span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className="p-3 md:p-5 w-full pr-12 text-sm md:text-base"
                  type={showPassword ? "text" : "password"}
                  id="senha"
                  placeholder="Insira sua senha"
                  {...register("senha")}
                  disabled={isSubmitting}
                  data-test="senha-input"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <img src="eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img src="eye-off.png" alt="" className="w-5 h-5 opacity-60" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
              )}
            </div>
            <Link href="/esqueci-senha" className="mt-2 md:mt-3 text-zinc-600 text-sm md:text-base underline cursor-pointer inline-block hover:text-zinc-800 transition-colors">
              Esqueci minha senha
            </Link>
            {error && (
              <div className="mt-3 md:mt-4 p-2 md:p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm md:text-base">
                {error}
              </div>
            )}
            <div className="mt-4 md:mt-6">
              <Button
                type="submit"
                className="p-3 md:p-5 w-full bg-[#306FCC] hover:bg-[#2557a7] transition-colors duration-500 cursor-pointer text-sm md:text-base"
                disabled={isSubmitting}
                data-test="botao-entrar"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
