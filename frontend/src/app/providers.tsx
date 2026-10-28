"use client";

import { NavigationGuardProvider } from "@/context/navigation-guard";
import { AuthProvider } from "@/context/auth-context";
import { I18nProvider } from "@/context/i18n-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures the client is created once per request
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <NavigationGuardProvider><AuthProvider>{children}</AuthProvider></NavigationGuardProvider>
      </I18nProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
