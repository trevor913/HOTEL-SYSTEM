import { AppShell } from "@/components/dashboard/AppShell";
import { SwRegister } from "@/components/dashboard/SwRegister";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <SwRegister />
      {children}
    </AppShell>
  );
}
