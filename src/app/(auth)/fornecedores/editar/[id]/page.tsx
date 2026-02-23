'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Cabecalho from '@/components/cabecalho';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/fetchData';
import { Fornecedor } from '@/types/fornecedores';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  fornecedorUpdateSchema,
  type FornecedorUpdateFormData,
} from '@/schemas';

interface FornecedorApiResponse {
  data: Fornecedor;
}

export default function EditarFornecedorPage() {
  const router = useRouter();
  const params = useParams();
  const fornecedorId = params.id as string;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FornecedorUpdateFormData>({
    resolver: zodResolver(fornecedorUpdateSchema),
    defaultValues: {
      nome: '',
      url: '',
      contato: '',
      descricao: '',
    },
  });

  const nomeValue = watch('nome', '');
  const contatoValue = watch('contato', '');
  const descricaoValue = watch('descricao', '');

  const { data: fornecedorData, isLoading: isLoadingFornecedor } =
    useQuery<FornecedorApiResponse>({
      queryKey: ['fornecedor', fornecedorId],
      queryFn: async () => {
        return await get<FornecedorApiResponse>(
          `/fornecedores/${fornecedorId}`,
        );
      },
      enabled: !!fornecedorId,
    });

  useEffect(() => {
    if (fornecedorData?.data) {
      const fornecedor: Fornecedor = fornecedorData.data;
      reset({
        nome: fornecedor.nome || '',
        url: fornecedor.url || '',
        contato: fornecedor.contato || '',
        descricao: fornecedor.descricao || '',
      });
    }
  }, [fornecedorData, reset]);

  const updateFornecedorMutation = useMutation({
    mutationFn: async (data: FornecedorUpdateFormData) => {
      return await patch(`/fornecedores/${fornecedorId}`, data);
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedor', fornecedorId] });
      router.push(`/fornecedores?success=updated&id=${fornecedorId}`);
    },
    onError: (error: any) => {
      toast.error(
        `Erro ao atualizar fornecedor: ${error?.response?.data?.message || error.message}`,
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
    },
  });

  const onSubmit = (data: FornecedorUpdateFormData) => {
    updateFornecedorMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/fornecedores');
  };

  if (isLoadingFornecedor) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <Cabecalho pagina="Fornecedores" acao="Editar" />
        <div className="flex-1 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6 flex flex-col overflow-hidden">
          <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-3 sm:p-4 md:p-8 flex flex-col gap-3 sm:gap-3 sm:gap-4 md:gap-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Nome */}
                <div>
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="w-full h-[38px] sm:h-[46px]" />
                </div>

                {/* URL */}
                <div>
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="w-full h-[38px] sm:h-[46px]" />
                </div>
              </div>

              {/* Contato */}
              <div>
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="w-full h-[38px] sm:h-[46px]" />
              </div>

              {/* Descrição */}
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="w-full flex-1 min-h-[120px]" />
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex justify-end gap-2 sm:gap-3 px-4 md:px-8 py-3 sm:py-4 border-t bg-gray-50 flex-shrink-0">
              <Skeleton className="h-[38px] w-[80px] sm:w-[120px]" />
              <Skeleton className="h-[38px] w-[80px] sm:w-[120px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <Cabecalho pagina="Fornecedores" acao="Editar" />

      <div className="flex-1 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6 flex flex-col overflow-hidden">
        <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 p-3 sm:p-4 md:p-8 flex flex-col gap-3 sm:gap-3 sm:gap-4 md:gap-6 overflow-y-auto">
              {/* Grid de 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {/* Nome */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label
                      htmlFor="nome"
                      className="text-sm md:text-base font-medium text-gray-900"
                    >
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {nomeValue?.length}/100
                    </span>
                  </div>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Nome do fornecedor"
                    {...register('nome')}
                    maxLength={100}
                    className={`w-full !px-3 sm:!px-4 !h-auto !min-h-[38px] sm:!min-h-[46px] text-sm sm:text-base ${errors.nome ? '!border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.nome && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.nome.message}
                    </p>
                  )}
                </div>

                {/* URL */}
                <div>
                  <Label
                    htmlFor="url"
                    className="text-sm md:text-base font-medium text-gray-900 mb-2 block"
                  >
                    URL
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://exemplo.com"
                    {...register('url')}
                    className={`w-full !px-3 sm:!px-4 !h-auto !min-h-[38px] sm:!min-h-[46px] text-sm sm:text-base ${errors.url ? '!border-red-500' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.url && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">
                      {errors.url.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contato - largura total */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label
                    htmlFor="contato"
                    className="text-sm md:text-base font-medium text-gray-900"
                  >
                    Contato
                  </Label>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {contatoValue?.length}/100
                  </span>
                </div>
                <Input
                  id="contato"
                  type="text"
                  placeholder="email@exemplo.com ou telefone"
                  {...register('contato')}
                  maxLength={100}
                  className={`w-full !px-3 sm:!px-4 !h-auto !min-h-[38px] sm:!min-h-[46px] text-sm sm:text-base ${errors.contato ? '!border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.contato && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.contato.message}
                  </p>
                )}
              </div>

              {/* Descrição - largura total */}
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center mb-2">
                  <Label
                    htmlFor="descricao"
                    className="text-sm md:text-base font-medium text-gray-900"
                  >
                    Descrição
                  </Label>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {descricaoValue?.length}/200
                  </span>
                </div>
                <textarea
                  id="descricao"
                  placeholder="Breve descrição do fornecedor..."
                  {...register('descricao')}
                  maxLength={200}
                  disabled={isSubmitting}
                  className="w-full flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px]"
                />
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex justify-end gap-2 sm:gap-3 px-4 md:px-8 py-3 sm:py-4 border-t bg-gray-50 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || updateFornecedorMutation.isPending}
                className="min-w-[80px] sm:min-w-[120px] cursor-pointer text-sm sm:text-base px-3 sm:px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="min-w-[80px] sm:min-w-[120px] text-white cursor-pointer hover:opacity-90 text-sm sm:text-base px-3 sm:px-4"
                style={{ backgroundColor: '#306FCC' }}
                disabled={isSubmitting || updateFornecedorMutation.isPending}
              >
                {isSubmitting || updateFornecedorMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </div>
          </form>
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
