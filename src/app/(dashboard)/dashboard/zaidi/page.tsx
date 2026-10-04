"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { BarChart3, CalendarClock, ChevronRight, Globe, MessageCircle, QrCode, Package, Settings, ShoppingBasket, Smartphone, Truck, Users, UtensilsCrossed } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import { item, list } from "@/lib/motion";

export default function ZaidiPage() {
  const t = useT();
  const s = useApp();
  const low = s.inventory.filter((i) => i.currentQty <= i.lowThreshold).length;
  const owed = s.suppliers.reduce((a, x) => a + x.balanceOwedCents, 0);
  const unmatched = s.mpesa.filter((m) => m.status === "unmatched").length;
  const tiles = [
    { href: "/dashboard/ripoti", icon: BarChart3, title: t.rep.title, body: `${t.rep.revenue} · ${t.rep.profit} · CSV`, tone: "text-sukuma" },
    { href: "/dashboard/menu", icon: UtensilsCrossed, title: t.ops.menu, body: `${s.menu.length} ${t.ops.items}`, tone: "text-flame" },
    { href: "/dashboard/menu/plan", icon: CalendarClock, title: t.ops.plan, body: t.ops.planBody, tone: "text-chai" },
    { href: "/dashboard/stock", icon: Package, title: t.ops.stock, body: low ? `${low} ${t.ops.lowCount}` : t.ops.stockBody, tone: low ? "text-nyanya" : "text-ugali" },
    { href: "/dashboard/wasambazaji", icon: Truck, title: t.ops.suppliers, body: owed ? `${t.ops.owed} ${formatKES(owed, { compact: true })}` : t.ops.allPaid, tone: "text-sukuma" },
    { href: "/dashboard/wafanyakazi", icon: Users, title: t.ops.staff, body: t.ops.staffBody, tone: "text-chai" },
    { href: "/dashboard/matumizi", icon: ShoppingBasket, title: t.nav.matumizi, body: "Soko, gas, makaa", tone: "text-nyanya" },
  ];
  const rows = [
    { href: "/dashboard/reconcile", icon: Smartphone, label: t.settings.reconcile, badge: unmatched },
    { href: `/m/${s.hotel.slug}`, icon: Globe, label: t.pub.publicMenu, badge: 0 },
    { href: "/dashboard/settings/qr", icon: QrCode, label: t.pub.poster, badge: 0 },
    { href: "/dashboard/settings/whatsapp-sim", icon: MessageCircle, label: t.settings.whatsappSim, badge: 0 },
    { href: "/dashboard/settings", icon: Settings, label: t.nav.settings, badge: 0 },
  ];
  return (
    <div className="pb-tabs">
      <PageHeader eyebrow={s.hotel.name} title={t.ops.more} />
      <p className="-mt-1 px-5 text-sm text-dim">{t.ops.moreBody}</p>
      <motion.div variants={list} initial="initial" animate="animate" className="mt-4 grid grid-cols-2 gap-3 px-5 lg:grid-cols-3">
        {tiles.map((x) => (
          <motion.div key={x.href} variants={item}>
            <Link href={x.href} className="flex min-h-32 flex-col justify-between rounded-3xl border border-line bg-raised p-4 active:scale-[0.98]">
              <x.icon className={`size-7 ${x.tone}`} />
              <span><span className="block font-display text-lg font-semibold leading-tight">{x.title}</span><span className="mt-0.5 block text-xs text-dim">{x.body}</span></span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
      <nav className="mx-5 mt-4 divide-y divide-line rounded-3xl border border-line bg-raised">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="flex h-16 items-center gap-3 px-4">
            <r.icon className="size-5 text-dim" /><span className="flex-1">{r.label}</span>
            {r.badge > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-flame px-1.5 text-xs font-bold text-[var(--flame-ink)]">{r.badge}</span>}
            <ChevronRight className="size-4 text-dim" />
          </Link>
        ))}
      </nav>
    </div>
  );
}