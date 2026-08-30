'use client';

import { useMutation } from '@tanstack/react-query';

// POST/DELETE /patrimonios/:id/foto — fora de `src/lib/fetchData.ts` porque o
// envio é multipart/form-data. Por isso NÃO herda o tratamento automático
// de 401/498 (signOut + redirect) que `get/post/put/patch/del` têm; um
// upload que expira a sessão falha silenciosamente para o `onError` do
// chamador, não desloga o usuário.
export function useUploadImagemPatrimonio() {
  const enviar = useMutation({
    mutationFn: async ({
      patrimonioId,
      arquivo,
    }: {
      patrimonioId: string;
      arquivo: File;
    }) => {
      const formData = new FormData();
      formData.append('file', arquivo);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patrimonios/${patrimonioId}/foto`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      );
      return await response.json();
    },
  });

  const remover = useMutation({
    mutationFn: async (patrimonioId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patrimonios/${patrimonioId}/foto`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      return await response.json();
    },
  });

  return { enviar, remover };
}
