// Netlify Scheduled Function: 18:30 EAT (15:30 UTC) Evening Pulse → /api/cron/daily
export default async () => {
  const r = await fetch(`${process.env.URL}/api/cron/daily?run=evening`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` } });
  return new Response(`evening ${r.status}`);
};
export const config = { schedule: "30 15 * * *" };