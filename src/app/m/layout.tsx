import type { Metadata } from "next";
import { Toaster } from "@/components/ui/Toast";

export const metadata: Metadata = { title: "Menyu · Agiza", description: "Menyu ya leo. Agiza na ulipe kwa M-Pesa." };

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}