"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Printer } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";

/** A5 "Menyu Yetu 📱 Scan hapa" poster with a QR to the public menu (§8.9). */
export default function QrPosterPage() {
  const t = useT();
  const hotel = useApp((s) => s.hotel);
  const toast = useToast((x) => x.show);
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");

  useEffect(() => {
    const u = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/m/${hotel.slug}`;
    setUrl(u);
    void QRCode.toDataURL(u, { margin: 1, width: 720, errorCorrectionLevel: "M", color: { dark: "#1C1917", light: "#FFFFFF" } }).then(setQr);
  }, [hotel.slug]);

  return (
    <div className="pb-tabs">
      <div className="no-print"><SubHeader title={t.pub.poster} sub={url} /></div>

      <div className="print-area mx-auto mt-3 w-[min(100%-2.5rem,420px)]">
        <div className="relative flex aspect-[148/210] flex-col overflow-hidden rounded-[20px] bg-[#FFF8EE] text-[#1C1917] shadow-2xl print:rounded-none print:shadow-none">
          <div className="bg-[#E8590C] px-6 pt-7 pb-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-85">{hotel.name}</p>
            <p className="mt-1 font-display text-[40px] leading-none font-semibold">{t.pub.posterTitle}</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt={url} className="aspect-square w-[68%] rounded-xl border-[6px] border-white shadow-lg" /> : <span className="aspect-square w-[68%] animate-pulse rounded-xl bg-[#eadfce]" />}
            <p className="mt-4 font-display text-2xl font-semibold">{t.pub.posterScan} 👆</p>
            <p className="mt-1 text-sm text-[#57534e]">{t.pub.posterBody}</p>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-[#d6c8b4] px-6 py-4 text-sm">
            <span><span className="block text-[10px] uppercase tracking-[0.16em] text-[#78716c]">Lipa na M-Pesa · Till</span><span className="font-display text-2xl font-semibold tabular-nums">{hotel.tillNumber}</span></span>
            <span className="text-right text-[11px] text-[#78716c]">{hotel.openHours.open}–{hotel.openHours.close}<br />{hotel.locationText.split(",")[0]}</span>
          </div>
        </div>
      </div>

      <div className="no-print mx-5 mt-5 grid grid-cols-3 gap-2">
        <button onClick={() => window.print()} className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-flame text-xs font-medium text-[var(--flame-ink)]"><Printer className="size-5" />{t.pub.print}</button>
        <button onClick={() => { void navigator.clipboard?.writeText(url); toast(t.pub.copied); }} className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-overlay text-xs"><Copy className="size-5" />{t.pub.copy}</button>
        <a href={`/m/${hotel.slug}`} target="_blank" rel="noreferrer" className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-overlay text-xs"><ExternalLink className="size-5" />{t.pub.publicMenu}</a>
      </div>
    </div>
  );
}