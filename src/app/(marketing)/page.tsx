import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Ticker } from "@/components/landing/Ticker";
import { Hero3D } from "@/components/landing/Hero3D";
import { ProblemStory } from "@/components/landing/ProblemStory";
import { MagicScene } from "@/components/landing/MagicScene";
import { Bento } from "@/components/landing/Bento";
import { Numbers } from "@/components/landing/Numbers";
import { Footer, Personas, Pricing } from "@/components/landing/Sections";

/** Landing (§9.8): 3D hero → problem storyboard → magic → bento → numbers → personas → pricing → footer. */
export default function Landing() {
  return (
    <main className="min-h-dvh overflow-x-clip bg-bg text-ink">
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
        <Hero3D />
        <div className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-t from-bg via-bg/50 to-transparent lg:bg-gradient-to-r lg:from-bg lg:via-bg/55 lg:to-transparent" />
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-safe">
          <Logo className="mt-4 text-xl" />
          <Link href="/dashboard" className="mt-4 flex h-11 items-center rounded-full px-4 text-sm text-dim hover:text-ink">Ingia</Link>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-8 lg:justify-center lg:pb-0">
          <p className="text-sm uppercase tracking-[0.2em] text-flame">Biashara yako. Kwenye simu yako.</p>
          <h1 className="mt-4 max-w-[12ch] font-display text-[46px] leading-[1.0] font-semibold lg:text-[88px]">Hotel yako. Digital. Leo.</h1>
          <p className="mt-5 max-w-md text-lg text-ink/80">Madeni, M-Pesa, oda na faida ya leo, kwa Kiswahili. Msaidizi anaandika ukiongea.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/onboarding" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-flame px-7 font-display text-lg font-semibold text-[var(--flame-ink)] shadow-[0_16px_40px_-14px_var(--flame)]">Anza Bure <ArrowRight className="size-5" /></Link>
            <Link href="/dashboard" className="flex h-14 items-center justify-center rounded-2xl border border-line bg-bg/40 px-7 font-medium backdrop-blur-sm">Ona demo</Link>
          </div>
        </div>
        <div className="pt-6"><Ticker /></div>
      </section>

      <ProblemStory />
      <MagicScene />
      <Bento />
      <Numbers />
      <Personas />
      <Pricing />
      <Footer />
    </main>
  );
}