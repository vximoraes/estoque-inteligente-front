"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { toast, ToastContainer, Slide } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import LogoEi from "@/components/logo-ei"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { esqueciSenhaSchema, type EsqueciSenhaFormData } from "@/schemas"

export default function EsqueciSenhaPage() {
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [emailUsuario, setEmailUsuario] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaFormData>({
    resolver: zodResolver(esqueciSenhaSchema),
  })

  const onSubmit = async (data: EsqueciSenhaFormData) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/recover`,
        { email: data.email }
      )

      if (response.data.error === false) {
        setEmailUsuario(data.email)
        setEmailEnviado(true)
        toast.success("E-mail de recuperação enviado com sucesso!", {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
          transition: Slide,
        })
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data

        toast.error(errorData.message || "Erro ao solicitar recuperação de senha.", {
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

  return (
    <div className="min-h-screen flex">
      <ToastContainer />
      <LogoEi />
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-4 md:mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              {emailEnviado ? "E-mail enviado!" : "Recuperação de senha"}
            </h2>
            <p className="text-zinc-600 text-sm md:text-base mt-2">
              {emailEnviado
                ? ""
                : "Informe o e-mail para o qual deseja redefinir sua senha."
              }
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
                  {...register("email")}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="mt-4 md:mt-6">
                <Button
                  type="submit"
                  className="p-3 md:p-5 w-full bg-[#306FCC] hover:bg-[#2557a7] transition-colors duration-500 cursor-pointer text-sm md:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="px-4 py-3">
                <p className="text-zinc-600 text-sm md:text-base text-center">
                  Um e-mail foi enviado para <strong>{emailUsuario}</strong> com instruções para redefinir sua senha.
                </p>
              </div>

              <div className="text-center">
                <p className="text-zinc-600 text-sm md:text-base mb-2">
                  Não recebeu o e-mail?
                </p>
                <Button
                  onClick={() => {
                    setEmailEnviado(false)
                    setEmailUsuario("")
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
              Lembrou sua senha?{" "}
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
  )
}
