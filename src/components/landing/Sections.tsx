import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const PERSONAS = [
  { img: "/img/mama-hotel.jpg", name: "Mama Mary", place: "Nourish Hotel, Kangemi", quote: "Daftari la madeni lilikuwa linanilala. Sasa nikifunga saa tatu najua faida yangu, shilingi kwa shilingi." },
  { img: "/img/samosa.jpg", name: "Baba Otieno", place: "Kibanda cha samosa, Githurai 45", quote: "Mteja akisema ametuma M-Pesa, sihitaji kufungua SMS. Simu inaniambia imeingia na ni ya nani." },
  { img: "/img/dining.jpg", name: "Wanjiru", place: "Chips & chapati, Rongai", quote: "Naambia Msaidizi “kesho nipike nini?” Pilau haiishi saa saba tena, na githeri haibaki." },
];

export function Personas() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-chai">Imejengwa kwa ajili yao</p>
      <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-semibold leading-tight lg:text-5xl">Mama, Baba na Dada Hotel.</h2>
      <div className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
        {PERSONAS.map((p, i) => (
          <figure key={p.name} className={`overflow-hidden rounded-[28px] border border-line bg-raised ${i === 0 ? "lg:row-span-2" : ""}`}>
            <div className={`relative ${i === 0 ? "aspect-[4/3] lg:aspect-[4/5]" : "aspect-[16/9]"}`}>
              <Image src={p.img} alt={p.place} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-raised via-transparent to-transparent" />
            </div>
            <blockquote className="px-5 pt-1 text-lg leading-snug">“{p.quote}”</blockquote>
            <figcaption className="px-5 pt-3 pb-5 text-sm"><span className="font-semibold">{p.name}</span> <span className="text-dim">· {p.place}</span></figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-xs text-dim">Wahusika wa muundo (design personas) walioongoza kila skrini.</p>
    </section>
  );
}

const PLANS = [
  { name: "Bure", price: "KSh 0", per: "milele", cta: "Anza Bure", hot: false, items: ["Madeni, mauzo na matumizi", "Msaidizi (bila mtandao)", "Menyu ya umma + QR", "Ripoti ya wiki", "Mfanyakazi 1"] },
  { name: "Pro", price: "KSh 499", per: "/mwezi", cta: "Jaribu Pro siku 14", hot: true, items: ["Kila kitu cha Bure", "Msaidizi wa AI + sauti", "M-Pesa Daraja inajilinganisha", "SMS za kumbusho na risiti", "Oda za WhatsApp", "Taarifa ya benki / SACCO", "Wafanyakazi bila kikomo + PIN"] },
];

export function Pricing() {
  return (
    <section id="bei" className="mx-auto max-w-6xl px-5 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-sukuma">Bei</p>
      <h2 className="mt-3 font-display text-4xl font-semibold leading-tight lg:text-5xl">Bei ya chai mbili kwa siku.</h2>
      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {PLANS.map((p) => (
          <article key={p.name} className={`flex flex-col rounded-[28px] border p-6 ${p.hot ? "border-flame bg-[color-mix(in_oklab,var(--flame)_7%,var(--bg-raised))]" : "border-line bg-raised"}`}>
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
              {p.hot && <span className="rounded-full bg-flame px-3 py-1 text-xs font-semibold text-[var(--flame-ink)]">Inapendwa</span>}
            </div>
            <p className="mt-4"><span className="money font-display text-5xl font-semibold">{p.price}</span> <span className="text-dim">{p.per}</span></p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {p.items.map((x) => <li key={x} className="flex gap-2.5"><Check className={`mt-0.5 size-5 shrink-0 ${p.hot ? "text-flame" : "text-sukuma"}`} />{x}</li>)}
            </ul>
            <Link href="/onboarding" className={`mt-8 flex h-14 items-center justify-center gap-2 rounded-2xl font-display text-lg font-semibold ${p.hot ? "bg-flame text-[var(--flame-ink)]" : "border border-line"}`}>{p.cta} <ArrowRight className="size-5" /></Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Logo className="text-3xl" />
          <p className="mt-4 max-w-sm text-dim">Biashara yako. Kwenye simu yako. Imetengenezwa Nairobi kwa hoteli za mtaa.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-dim">
          <Link href="/onboarding" className="hover:text-ink">Anza Bure</Link>
          <Link href="/dashboard" className="hover:text-ink">Demo</Link>
          <Link href="/m/nourish-hotel" className="hover:text-ink">Menyu ya mfano</Link>
          <a href="#bei" className="hover:text-ink">Bei</a>
        </nav>
      </div>
    </footer>
  );
}