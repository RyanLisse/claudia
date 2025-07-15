"use client";

import { OutputCacheProvider } from "@/lib/outputCache";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <OutputCacheProvider>
      {children}
    </OutputCacheProvider>
  );
}