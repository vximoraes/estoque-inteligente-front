'use client';

import { useMutation } from '@tanstack/react-query';

// POST/DELETE /itens/:id/foto — fora de `src/lib/fetchData.ts` porque o
// envio é multipart/form-data. Por isso NÃO herda o tratamento automático
// de 401/498 (signOut + redirect) que `get/post/put/patch/del` têm; um
// upload que expira a sessão falha silenciosamente para o `onError` do
// chamador, não desloga o usuário.
export function useUploadImagemItem() {
  const enviar = useMutation({
    mutationFn: async ({
      itemId,
      arquivo,
    }: {
      itemId: string;
      arquivo: File;
    }) => {
      const formData = new FormData();
      formData.append('file', arquivo);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/itens/${itemId}/foto`,
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
    mutationFn: async (itemId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/itens/${itemId}/foto`,
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
