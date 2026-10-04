"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, BookOpen, Bot, ChefHat, CloudOff, Home, LayoutGrid, Mic, NotebookPen, Plus, Receipt, Settings, ShoppingBasket, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Toaster } from "@/components/ui/Toast";
import { NewDebtSheet } from "./NewDebtSheet";
import { MsaidiziLauncher } from "./MsaidiziLauncher";
import { PinLock } from "./PinLock";
import { OrderAlerts } from "./OrderAlerts";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { cn } from "@/lib/utils/cn";
import { steam } from "@/lib/motion";

export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const theme = useApp((s) => s.theme);
  useEffect(() => { setReady(true); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  if (!ready) return <Splash />;
  return <Shell>{children}</Shell>;
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <Logo className="text-3xl" />
    </div>
  );
}

type Tab = { href: string; label: string; icon: typeof Home; badge?: number };

function Shell({ children }: { children: ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const pendingOrders = useApp((s) => s.orders.filter((o) => o.status === "new").length);
  const [debtOpen, setDebtOpen] = useState(false);
  const online = useOnline();
  const pendingSync = useApp((s) => s.pendingSync);

  const tabs: Tab[] = [
    { href: "/dashboard", label: t.nav.home, icon: Home },
    { href: "/dashboard/mauzo", label: t.nav.mauzo, icon: Receipt },
    { href: "/dashboard/madeni", label: t.nav.madeni, icon: NotebookPen },
    { href: "/dashboard/oda", label: t.nav.oda, icon: ChefHat, badge: pendingOrders },
    { href: "/dashboard/msaidizi", label: t.nav.msaidizi, icon: Bot },
  ];
  const side: Tab[] = [...tabs, { href: "/dashboard/matumizi", label: t.nav.matumizi, icon: ShoppingBasket }, { href: "/dashboard/ripoti", label: t.rep.title, icon: BarChart3 }, { href: "/dashboard/zaidi", label: t.nav.more, icon: LayoutGrid }, { href: "/dashboard/settings", label: t.nav.settings, icon: Settings }];
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));
  const hideFab = pathname.startsWith("/dashboard/msaidizi") || pathname.startsWith("/dashboard/mauzo") || pathname.startsWith("/dashboard/madeni");

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[248px_1fr]">
      <Toaster />
      {/* Desktop sidebar (secondary layout) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line px-4 py-6 lg:flex">
        <Logo className="px-2 text-2xl" />
        <nav className="mt-10 flex flex-col gap-1">
          {side.map((s) => (
            <Link key={s.href} href={s.href} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium", isActive(s.href) ? "bg-overlay text-ink" : "text-dim hover:text-ink")}>
              <s.icon className={cn("size-[18px]", isActive(s.href) && "text-flame")} /> {s.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="relative mx-auto w-full max-w-lg pb-tabs lg:max-w-3xl lg:pb-10">
        {(!online || pendingSync > 0) && (
          <div className="sticky top-0 z-30 flex justify-center pt-safe">
            <span className="flex items-center gap-2 rounded-full border border-line bg-overlay px-3 py-1.5 text-xs text-dim">
              <CloudOff className="size-3.5 text-chai" /> {t.common.offline}… {pendingSync > 0 && `${pendingSync} ${t.common.pending}`}
            </span>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: steam }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!hideFab && <SpeedDial onDebt={() => setDebtOpen(true)} />}
      {!pathname.startsWith("/dashboard/msaidizi") && !pathname.startsWith("/dashboard/mauzo") && <MsaidiziLauncher />}
      <NewDebtSheet open={debtOpen} onClose={() => setDebtOpen(false)} />
      <PinLock />
      <OrderAlerts />

      {/* Bottom tab bar: thumb zone (mobile) */}
      <nav className="bottom-tabs fixed inset-x-0 z-40 border-t border-line bg-bg/95 backdrop-blur-md lg:hidden" aria-label="Main">
        <ul className="mx-auto grid h-[var(--tab-h)] max-w-lg grid-cols-5">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <li key={tab.href}>
                <Link href={tab.href} className="relative flex h-full flex-col items-center justify-center gap-1" aria-current={active ? "page" : undefined}>
                  {active && <motion.span layoutId="tab-pill" className="absolute top-2 h-8 w-14 rounded-full bg-[color-mix(in_oklab,var(--flame)_16%,transparent)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                  <span className="relative">
                    <tab.icon className={cn("size-[22px]", active ? "text-flame" : "text-dim")} strokeWidth={active ? 2.3 : 1.8} />
                    {!!tab.badge && <span className="pulse-ring absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-flame px-1 text-[10px] font-bold text-[var(--flame-ink)]">{tab.badge}</span>}
                  </span>
                  <span className={cn("relative text-[11px] font-medium", active ? "text-ink" : "text-dim")}>{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function SpeedDial({ onDebt }: { onDebt: () => void }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const actions = [
    { label: t.fab.voice, icon: Mic, run: () => router.push("/dashboard/msaidizi?voice=1") },
    { label: t.fab.expense, icon: Wallet, run: () => router.push("/dashboard/matumizi") },
    { label: t.fab.debt, icon: BookOpen, run: onDebt },
    { label: t.fab.sale, icon: Receipt, run: () => router.push("/dashboard/mauzo") },
  ];
  return (
    <>
      <AnimatePresence>{open && <motion.button aria-label="Close" className="fixed inset-0 z-40 bg-[var(--scrim)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />}</AnimatePresence>
      <div className="above-tabs fixed right-4 z-40 flex flex-col items-end gap-3 lg:bottom-8 lg:right-8">
        <AnimatePresence>
          {open && actions.map((a, i) => (
            <motion.button key={a.label} onClick={() => { setOpen(false); a.run(); }}
              initial={{ opacity: 0, y: 16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: (actions.length - i) * 0.04, ease: steam } }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="flex items-center gap-3">
              <span className="rounded-full bg-overlay px-3 py-1.5 text-sm font-medium shadow-lg">{a.label}</span>
              <span className="grid size-12 place-items-center rounded-full bg-raised text-ink shadow-lg ring-1 ring-line"><a.icon className="size-5" /></span>
            </motion.button>
          ))}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.92 }} animate={{ rotate: open ? 45 : 0 }} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Quick actions"
          className="grid size-16 place-items-center rounded-[22px] bg-flame text-[var(--flame-ink)] shadow-[0_10px_30px_-8px_var(--flame)]">
          <Plus className="size-7" strokeWidth={2.6} />
        </motion.button>
      </div>
    </>
  );
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return online;
}
