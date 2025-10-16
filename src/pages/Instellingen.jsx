// file: src/pages/Instellingen.jsx
import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

export default function Instellingen(){
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  // Algemeen (FX & whitelist)
  const [fxSource, setFxSource] = useState("auto");
  const [fallback, setFallback] = useState(0.92);
  const [whitelist, setWhitelist] = useState("BTCEUR,ETHEUR");

  // Strategie-params
  const [sc, setSc] = useState({
    timeframe:"4h", cooldown_sec:21600,
    rsi_buy:30, rsi_sell:55, z_buy:-2.0, z_sell:0.0,
    tp_pct:0.06, sl_pct:0.03
  });
  const [ss, setSs] = useState({
    interval:"1d", cooldown_sec:21600,
    rsi_buy:35, rsi_sell:60, z_buy:-1.5, z_sell:0.0,
    tp_pct:0.08, sl_pct:0.04
  });

  // AI-instellingen
  const [useAiCrypto, setUseAiCrypto] = useState(false);
  const [useAiStocks, setUseAiStocks] = useState(false);
  const [aiConfMin, setAiConfMin] = useState(0.55); // 55%

  useEffect(()=>{(async()=>{
    const { data, error } = await supabase
      .from("settings")
      .select("fx_source,fallback_usdt_eur,whitelist,strategy_crypto,strategy_stocks,use_ai_crypto,use_ai_stocks,ai_conf_min")
      .eq("id", 1)
      .single();

    if (!error && data){
      setFxSource(data.fx_source || "auto");
      setFallback(Number(data.fallback_usdt_eur ?? 0.92));
      setWhitelist((data.whitelist||[]).join(","));

      if (data.strategy_crypto) setSc(data.strategy_crypto);
      if (data.strategy_stocks) setSs(data.strategy_stocks);

      setUseAiCrypto(!!data.use_ai_crypto);
      setUseAiStocks(!!data.use_ai_stocks);
      setAiConfMin(Number(data.ai_conf_min ?? 0.55));
    }
    setLoading(false);
  })();},[]);

  const save = async () => {
    setStatus("Opslaan…");
    const wl = whitelist.split(",").map(s=>s.trim()).filter(Boolean);
    const payload = {
      id: 1,
      fx_source: fxSource,
      fallback_usdt_eur: Number(isNaN(fallback) ? 0.92 : fallback),
      whitelist: wl,
      strategy_crypto: sc,
      strategy_stocks: ss,
      use_ai_crypto: useAiCrypto,
      use_ai_stocks: useAiStocks,
      ai_conf_min: Number(isNaN(aiConfMin) ? 0.55 : aiConfMin)
    };
    const { error } = await supabase.from("settings").upsert(payload);
    setStatus(error ? `Fout: ${error.message}` : "Opgeslagen ✅");
    setTimeout(()=>setStatus(""), 2500);
  };

  if (loading) return <div>Bezig met laden…</div>;

  const Field = ({label, children}) => (
    <label style={{display:"grid", gap:6}}>
      <span style={{fontSize:12, color:"#475569"}}>{label}</span>
      {children}
    </label>
  );

  const Num = ({value, onChange, step=0.01, min, max}) =>
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={e=>{
        const v = parseFloat(e.target.value);
        onChange(isNaN(v) ? "" : v);
      }}
      style={{padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8}}
    />;

  const Check = ({checked, onChange}) =>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={e=>onChange(e.target.checked)}
      style={{width:18, height:18}}
    />;

  return (
    <div style={{display:"grid", gap:24}}>
      <h1>Instellingen</h1>

      {/* ALGEMEEN */}
      <section style={{display:"grid", gap:12}}>
        <h3>Algemeen (EUR & FX)</h3>
        <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>
          <Field label="FX bron">
            <select value={fxSource} onChange={e=>setFxSource(e.target.value)} style={{padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8}}>
              <option value="auto">auto</option>
              <option value="manual">handmatig (fallback)</option>
            </select>
          </Field>
          <Field label="Fallback USDT→EUR">
            <Num value={fallback} onChange={setFallback} step={0.001}/>
          </Field>
          <Field label="Crypto-whitelist (comma)">
            <input value={whitelist} onChange={e=>setWhitelist(e.target.value)} style={{padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8}}/>
          </Field>
        </div>
      </section>

      {/* AI & MODELLEN */}
      <section style={{display:"grid", gap:12}}>
        <h3>AI & Modellen</h3>
        <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>
          <Field label="AI voor Crypto">
            <Check checked={useAiCrypto} onChange={setUseAiCrypto}/>
          </Field>
          <Field label="AI voor Aandelen">
            <Check checked={useAiStocks} onChange={setUseAiStocks}/>
          </Field>
          <Field label="AI confidence drempel (0.50–0.90)">
            <Num value={aiConfMin} onChange={setAiConfMin} step={0.01} min={0.5} max={0.9}/>
            <span style={{fontSize:12, color:"#64748b"}}>
              Voorbeeld: 0.60 betekent alleen BUY als model ≥ 60% kans op stijging; SELL als ≤ 40%.
            </span>
          </Field>
        </div>
      </section>

      {/* STRATEGIE – CRYPTO */}
      <section style={{display:"grid", gap:12}}>
        <h3>Strategie – Crypto (swing)</h3>
        <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))"}}>
          <Field label="Timeframe">
            <input value={sc.timeframe} onChange={e=>setSc({...sc, timeframe:e.target.value})} style={{padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8}}/>
          </Field>
          <Field label="Cooldown (sec)"><Num value={sc.cooldown_sec} onChange={v=>setSc({...sc, cooldown_sec:v})} step={1}/></Field>
          <Field label="RSI koop"><Num value={sc.rsi_buy} onChange={v=>setSc({...sc, rsi_buy:v})} step={1}/></Field>
          <Field label="RSI verkoop"><Num value={sc.rsi_sell} onChange={v=>setSc({...sc, rsi_sell:v})} step={1}/></Field>
          <Field label="z-score koop"><Num value={sc.z_buy} onChange={v=>setSc({...sc, z_buy:v})} step={0.1}/></Field>
          <Field label="z-score verkoop"><Num value={sc.z_sell} onChange={v=>setSc({...sc, z_sell:v})} step={0.1}/></Field>
          <Field label="Take-profit %"><Num value={sc.tp_pct} onChange={v=>setSc({...sc, tp_pct:v})} step={0.01}/></Field>
          <Field label="Stop-loss %"><Num value={sc.sl_pct} onChange={v=>setSc({...sc, sl_pct:v})} step={0.01}/></Field>
        </div>
      </section>

      {/* STRATEGIE – AANDELEN */}
      <section style={{display:"grid", gap:12}}>
        <h3>Strategie – Aandelen (swing)</h3>
        <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))"}}>
          <Field label="Interval">
            <input value={ss.interval} onChange={e=>setSs({...ss, interval:e.target.value})} style={{padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8}}/>
          </Field>
          <Field label="Cooldown (sec)"><Num value={ss.cooldown_sec} onChange={v=>setSs({...ss, cooldown_sec:v})} step={1}/></Field>
          <Field label="RSI koop"><Num value={ss.rsi_buy} onChange={v=>setSs({...ss, rsi_buy:v})} step={1}/></Field>
          <Field label="RSI verkoop"><Num value={ss.rsi_sell} onChange={v=>setSs({...ss, rsi_sell:v})} step={1}/></Field>
          <Field label="z-score koop"><Num value={ss.z_buy} onChange={v=>setSs({...ss, z_buy:v})} step={0.1}/></Field>
          <Field label="z-score verkoop"><Num value={ss.z_sell} onChange={v=>setSs({...ss, z_sell:v})} step={0.1}/></Field>
          <Field label="Take-profit %"><Num value={ss.tp_pct} onChange={v=>setSs({...ss, tp_pct:v})} step={0.01}/></Field>
          <Field label="Stop-loss %"><Num value={ss.sl_pct} onChange={v=>setSs({...ss, sl_pct:v})} step={0.01}/></Field>
        </div>
      </section>

      <div style={{display:"flex", gap:8}}>
        <button
          onClick={save}
          style={{
            padding:"10px 14px",
            background:"#38bdf8",
            color:"#0f172a",
            border:"none",
            borderRadius:8,
            fontWeight:700
          }}
        >
          Opslaan
        </button>
        {status && <span>{status}</span>}
      </div>
    </div>
  );
}
