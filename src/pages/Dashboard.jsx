import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

export default function Dashboard() {
  const [cryptoSnap, setCryptoSnap] = useState(null);
  const [stocksSnap, setStocksSnap] = useState(null);
  const [todayCounts, setTodayCounts] = useState({ signals: 0, trades: 0 });

  useEffect(() => {
    (async () => {
      const { data: snaps } = await supabase
        .from("equity_snapshots")
        .select("ts,equity,day_pnl,agent")
        .order("ts", { ascending: false })
        .limit(50);

      if (snaps && snaps.length) {
        setCryptoSnap(snaps.find(s => s.agent === "crypto") || null);
        setStocksSnap(snaps.find(s => s.agent === "stocks") || null);
      }

      const today = new Date(); today.setHours(0,0,0,0);
      const iso = today.toISOString();

      const [{ count: sigCount }, { count: trdCount }] = await Promise.all([
        supabase.from("signals").select("*", { count: "exact", head: true }).gte("ts", iso),
        supabase.from("trades").select("*", { count: "exact", head: true }).gte("ts", iso),
      ]);
      setTodayCounts({ signals: sigCount || 0, trades: trdCount || 0 });
    })();
  }, []);

  const Card = ({ title, value, sub }) => (
    <div style={{background:"#ffffff", border:"1px solid #e5e7eb", borderRadius:12, padding:16}}>
      <div style={{fontSize:12, color:"#64748b"}}>{title}</div>
      <div style={{fontSize:22, fontWeight:700, color:"#0f172a"}}>{value ?? "—"}</div>
      {sub && <div style={{fontSize:12, color:"#334155"}}>{sub}</div>}
    </div>
  );

  const ts = s => (s?.ts ? s.ts.slice(0,19).replace("T"," ") : "");

  return (
    <div style={{display:"grid", gap:16, color:"#0f172a"}}>
      <h1 style={{margin:0}}>Overzicht</h1>
      <div style={{display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))"}}>
        <Card
          title="Crypto equity (laatste)"
          value={cryptoSnap ? `${cryptoSnap.equity.toFixed(2)} EUR` : "—"}
          sub={ts(cryptoSnap)}
        />
        <Card
          title="Aandelen equity (laatste)"
          value={stocksSnap ? `${stocksSnap.equity.toFixed(2)} EUR` : "—"}
          sub={ts(stocksSnap)}
        />
        <Card title="Signalen (vandaag)" value={todayCounts.signals} />
        <Card title="Trades (vandaag)" value={todayCounts.trades} />
      </div>
    </div>
  );
}
