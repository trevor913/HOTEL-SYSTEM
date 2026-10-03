// Netlify Scheduled Function: 05:30 EAT (02:30 UTC) Morning Brief → /api/cron/daily
export default async () => {
  const r = await fetch(`${process.env.URL}/api/cron/daily?run=morning`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? ""}` } });
  return new Response(`morning ${r.status}`);
};
export const config = { schedule: "30 2 * * *" };