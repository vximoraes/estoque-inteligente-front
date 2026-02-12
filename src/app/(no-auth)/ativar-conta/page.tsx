"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { toast } from "react-toastify"
import { ToastContainer, Slide } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Check, X } from "lucide-react"
import LogoEi from "@/components/logo-ei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PulseLoader } from "react-spinners"
import Link from "next/link"
import { ativarContaSchema, type AtivarContaFormData } from "@/schemas"

interface PasswordRequirement {
  text: string
  regex: RegExp
}

const passwordRequirements: PasswordRequirement[] = [
  { text: "Mínimo de 8 caracteres", regex: /.{8,}/ },
  { text: "Uma letra maiúscula", regex: /[A-Z]/ },
  { text: "Uma letra minúscula", regex: /[a-z]/ },
  { text: "Um número", regex: /\d/ },
  { text: "Um caractere especial (@, #, $, %, etc.)", regex: /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/ },
]

function AtivarContaContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValido, setTokenValido] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AtivarContaFormData>({
    resolver: zodResolver(ativarContaSchema),
  })

  const senhaAtual = watch("senha", "")

  useEffect(() => {
    if (!token) {
      setTokenValido(false)
      toast.error("Token de convite não encontrado.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
    } else {
      setTokenValido(true)
    }
  }, [token])

  const checkPasswordRequirement = (requirement: PasswordRequirement): boolean => {
    return requirement.regex.test(senhaAtual)
  }

  const onSubmit = async (data: AtivarContaFormData) => {
    if (!token) {
      toast.error("Token de convite inválido.", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        transition: Slide,
      })
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/ativar-conta?token=${token}`,
        {
          senha: data.senha,
        }
      )

      if (response.data.error === false) {
        toast.success("Conta ativada com sucesso! Redirecionando para o login...", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        })

        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data

        toast.error(errorData.message || "Ocorreu um erro ao ativar sua conta.", {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        })
      } else {
        toast.error("Ocorreu um erro inesperado. Tente novamente.", {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        })
      }
    }
  }

  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex">
        <LogoEi />
        <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Inválido</h2>
              <p className="text-gray-600">
                O link de convite é inválido ou expirou. 
                Entre em contato com o administrador para solicitar um novo convite.
              </p>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="bg-[#306FCC] hover:bg-[#2557a7]"
            >
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <LogoEi />
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              Ativação de conta
            </h2>
            <p className="text-zinc-600 text-sm md:text-base mt-2">
              Crie uma senha segura para ativar sua conta e começar a utilizar o sistema.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="pt-3 md:pt-4">
              <Label className="pb-2 text-sm md:text-base" htmlFor="senha">
                Senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className={`p-3 md:p-5 w-full pr-12 text-sm md:text-base ${
                    errors.senha ? "border-red-500" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  id="senha"
                  placeholder="Insira sua senha"
                  {...register("senha")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? (
                    <img src="/eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img src="/eye-off.png" alt="" className="w-5 h-5 opacity-60" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
              )}

              {/* Validação visual da senha em tempo real */}
              {senhaAtual && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <ul className="space-y-1.5">
                    {passwordRequirements.map((requirement, index) => {
                      const isValid = checkPasswordRequirement(requirement)
                      return (
                        <li
                          key={index}
                          className={`text-sm flex items-center gap-2 transition-colors duration-200 ${
                            isValid ? "text-green-600" : "text-gray-600"
                          }`}
                        >
                          {isValid ? (
                            <Check className="flex-shrink-0 w-4 h-4" />
                          ) : (
                            <X className="flex-shrink-0 w-4 h-4" />
                          )}
                          <span>{requirement.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="pt-3 md:pt-4">
              <Label className="pb-2 text-sm md:text-base" htmlFor="confirmarSenha">
                Confirmar senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  className={`p-3 md:p-5 w-full pr-12 text-sm md:text-base ${
                    errors.confirmarSenha ? "border-red-500" : ""
                  }`}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmarSenha"
                  placeholder="Confirme sua senha"
                  {...register("confirmarSenha")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <img src="/eye.png" alt="" className="w-5 h-5 opacity-60" />
                  ) : (
                    <img src="/eye-off.png" alt="" className="w-5 h-5 opacity-60" />
                  )}
                </button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmarSenha.message}</p>
              )}
            </div>
            
            <div className="mt-4 md:mt-6">
              <Button
                type="submit"
                className="p-3 md:p-5 w-full bg-[#306FCC] hover:bg-[#2557a7] transition-colors duration-500 cursor-pointer text-sm md:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ativando conta..." : "Ativar conta"}
              </Button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-zinc-600 text-sm md:text-base">
              Já tem uma conta ativa?{" "}
              <Link
                href="/login"
                className="text-[#306FCC] hover:text-[#2557a7] underline font-medium"
              >
                Entrar
              </Link>
            </p>
          </div>
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
  )
}

export default function AtivarContaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <PulseLoader color="#306FCC" size={15} />
      </div>
    }>
      <AtivarContaContent />
    </Suspense>
  )
}
