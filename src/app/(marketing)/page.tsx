import Link from "next/link";
import { ArrowRight, NotebookPen, Smartphone, Bot, ChefHat } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Ticker } from "@/components/landing/Ticker";

/**
 * Landing v0 (mobile-first). Phase 8 upgrades this with the R3F night-market hero,
 * GSAP scroll scenes, bento live demos, testimonials and pricing.
 */
export default function Landing() {
  return (
    <main className="min-h-dvh bg-bg text-ink">
      <div className="ember grain">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-safe pb-4">
          <Logo className="mt-4 text-xl" />
          <Link href="/dashboard" className="mt-4 text-sm text-dim hover:text-ink">Ingia</Link>
        </header>
        <section className="mx-auto max-w-5xl px-5 pt-10 pb-14 lg:pt-20">
          <p className="text-sm uppercase tracking-[0.2em] text-flame">Biashara yako. Kwenye simu yako.</p>
          <h1 className="mt-4 max-w-[14ch] font-display text-[44px] leading-[1.02] font-semibold lg:text-7xl">Hotel yako. Digital. Leo.</h1>
          <p className="mt-5 max-w-md text-lg text-dim">Daftari la madeni linapoteza pesa. Hotel System inakumbuka kila deni, inalinganisha M-Pesa, na inakuambia faida ya leo kabla hujafunga.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-flame px-7 font-display text-lg font-semibold text-[var(--flame-ink)]">Anza Bure <ArrowRight className="size-5" /></Link>
            <Link href="/dashboard/msaidizi" className="flex h-14 items-center justify-center rounded-2xl border border-line px-7 font-medium">Ongea na Msaidizi</Link>
          </div>
        </section>
        <Ticker />
      </div>

      <section className="mx-auto grid max-w-5xl gap-3 px-5 py-14 sm:grid-cols-6">
        <Feature className="sm:col-span-4" icon={<NotebookPen className="size-6 text-nyanya" />} title="Madeni hayapotei tena" body="Kila deni na jina, tarehe na salio. Telezesha kulia kulipa, kushoto kutuma kumbusho la SMS. Deni likiisha, mteja anapata risiti." />
        <Feature className="sm:col-span-2" icon={<Smartphone className="size-6 text-sukuma" />} title="M-Pesa inajilinganisha" body="Malipo yanafika, yanaunganishwa na deni au oda yenyewe." />
        <Feature className="sm:col-span-2" icon={<Bot className="size-6 text-flame" />} title="Msaidizi anaelewa Sheng" body="“Andika deni ya Otieno mia mbili hamsini.” Imeandikwa." />
        <Feature className="sm:col-span-4" icon={<ChefHat className="size-6 text-chai" />} title="Oda kutoka kwa menyu yako" body="Wateja wanaona menyu ya leo kwenye simu, wanaagiza, unapata ding. Rider anabeba, mteja anapata SMS kila hatua." />
      </section>

      <footer className="border-t border-line px-5 py-10 text-center text-sm text-dim">
        <Logo className="text-lg" />
        <p className="mt-3">Imetengenezwa Nairobi kwa Mama na Baba Hotel.</p>
      </footer>
    </main>
  );
}

function Feature({ icon, title, body, className }: { icon: React.ReactNode; title: string; body: string; className?: string }) {
  return (
    <article className={`rounded-3xl border border-line bg-raised p-6 ${className ?? ""}`}>
      {icon}
      <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-dim">{body}</p>
    </article>
  );
}
