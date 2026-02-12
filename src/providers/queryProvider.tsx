"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from "react"

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: (failureCount, error: any) => {
                    if (error?.status === 401 || error?.status === 498) {
                        return false;
                    }

                    if (error?.message?.toLowerCase().includes('autenticação') || 
                        error?.message?.toLowerCase().includes('sessão expirada')) {
                        return false;
                    }
                    return failureCount < 3;
                },
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}