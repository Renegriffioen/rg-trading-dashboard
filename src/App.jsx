import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

const fmtEUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

function useRealtimeSafe(table, select='*', order='ts', desc=true, limit=50){
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  useEffect(()=>{
    let mounted = true
    const load = async()=>{
      try{
        let q = supabase.from(table).select(select).order(order, {ascending:!desc})
        if(limit) q = q.limit(limit)
        const { data, error } = await q
        if(error) throw error
        if(mounted) setRows(data||[])
      }catch(e){
        if(mounted) setError(e.message)
      }
    }
    load()
    const sub = supabase.channel(`${table}-changes`).on(
      'postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload)=>{
        setRows(prev=>[payload.new, ...prev].slice(0, limit))
      }
    ).subscribe()
    return ()=>{ mounted=false; supabase.removeChannel(sub) }
  }, [table, select, order, desc, limit])
  return { rows, error }
}

export default function App(){
  const { rows: trades, error: tradesErr } = useRealtimeSafe('trades','id,ts,symbol,side,qty,price,price_eur,quote_ccy','ts',true,50)
  const { rows: equity, error: eqErr } = useRealtimeSafe('equity_snapshots','ts,equity,day_pnl','ts',true,1)
  const { rows: signals, error: sigErr } = useRealtimeSafe('signals','id,ts,symbol,side,confidence,reason','ts',true,20)

  const lastEq = equity[0]

  // ---- Instellingen (settings singleton id=1) ----
  const [settings, setSettings] = useState(null)
  const [fallback, setFallback] = useState('0.92')
  const [fxSource, setFxSource] = useState('auto')   // 'auto' | 'manual'
  const [wlText, setWlText] = useState('BTCEUR,ETHEUR')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(()=>{
    let mounted = true
    const load = async ()=>{
      const { data, error } = await supabase
        .from('settings')
        .select('fallback_usdt_eur, fx_source, whitelist')
        .eq('id', 1)
        .single()
      if(!mounted) return
      if(!error && data){
        setSettings(data)
        setFallback(String(data.fallback_usdt_eur ?? '0.92'))
        setFxSource(data.fx_source ?? 'auto')
        setWlText(Array.isArray(data.whitelist) ? data.whitelist.join(',') : 'BTCEUR,ETHEUR')
      }
    }
    load()
    const sub = supabase.channel('settings-live').on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'settings' },
      (payload)=>{
        const d = payload.new
        setSettings(d)
        setFallback(String(d.fallback_usdt_eur ?? '0.92'))
        setFxSource(d.fx_source ?? 'auto')
        setWlText(Array.isArray(d.whitelist) ? d.whitelist.join(',') : 'BTCEUR,ETHEUR')
      }
    ).subscribe()
    return ()=>{ mounted=false; supabase.removeChannel(sub) }
  }, [])

  const onSave = async ()=>{
    setSaveMsg(null)
    let val = parseFloat(fallback)
    if(Number.isNaN(val)) { setSaveMsg('Voer een getal in voor fallback USDT→EUR.'); return }
    if(val <= 0.5 || val >= 1.5){ setSaveMsg('Waarde buiten redelijke band (0.5–1.5).'); return }
    const wl = wlText.split(',').map(s=>s.trim()).filter(Boolean)
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .update({
        fallback_usdt_eur: val,
        fx_source: fxSource,
        whitelist: wl,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
    setSaving(false)
    setSaveMsg(error ? `Opslaan mislukt: ${error.message}` : 'Opgeslagen ✔')
  }

  return (
    <div className="wrap">
      <h1 style={{margin:'10px 0'}}>📈 Handelsdashboard</h1>

      <div className="muted" style={{marginBottom:8}}>
        {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
          <div className="err">Omgeving ontbreekt: zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY</div>
        )}
        {(tradesErr || eqErr || sigErr) && (
          <div className="err">Supabase-fout of tabellen nog niet aanwezig. ({tradesErr || eqErr || sigErr})</div>
        )}
      </div>

      {/* KPI + Signalen */}
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="kpi">
          <div>Vermogen (EUR)</div>
          <div style={{fontSize:28,fontWeight:700}}>{lastEq? fmtEUR.format(lastEq.equity): '—'}</div>
          <div className="muted">Dag-PnL: {lastEq? fmtEUR.format(lastEq.day_pnl): '—'}</div>
        </div>

        <div className="kpi">
          <div>Open/recente signalen</div>
          <div style={{maxHeight:120, overflowY:'auto'}}>
            {signals.map(s=> (
              <div key={s.id} style={{display:'flex',gap:8,alignItems:'center',margin:'6px 0'}}>
                <span className={`pill ${s.side==='buy'?'buy':'sell'}`}>{s.side}</span>
                <span style={{fontWeight:600}}>{s.symbol}</span>
                <span style={{opacity:.8}}>vertr. {s.confidence?.toFixed(2)}</span>
                <span style={{opacity:.6}}>{new Date(s.ts).toLocaleTimeString('nl-NL')}</span>
                <span style={{opacity:.6}}>• {s.reason}</span>
              </div>
            ))}
            {signals.length===0 && <div className="muted">(nog geen signalen)</div>}
          </div>
        </div>
      </div>

      {/* Instellingen paneel */}
      <div className="kpi" style={{marginTop:12}}>
        <h2 style={{margin:'0 0 8px'}}>⚙️ Instellingen</h2>
        {!settings && <div className="muted">Instellingen laden…</div>}

        <div style={{display:'grid', gap:10}}>
          <label style={{display:'grid', gap:6}}>
            <span className="muted">Bron wisselkoers (USDT→EUR)</span>
            <select value={fxSource} onChange={e=>setFxSource(e.target.value)} style={{padding:'8px', borderRadius:8, border:'1px solid #263159', background:'#0b1020', color:'#fff'}}>
              <option value="auto">auto (probeer live EUR/USDT via exchange)</option>
              <option value="manual">handmatig (gebruik de fallback hieronder)</option>
            </select>
          </label>

          <label style={{display:'grid', gap:6}}>
            <span className="muted">Fallback USDT→EUR (bijv. 0.92)</span>
            <input value={fallback} onChange={e=>setFallback(e.target.value)} placeholder="0.92"
              style={{padding:'8px', borderRadius:8, border:'1px solid #263159', background:'#0b1020', color:'#fff'}} />
          </label>

          <label style={{display:'grid', gap:6}}>
            <span className="muted">Whitelist (komma-gescheiden)</span>
            <input value={wlText} onChange={e=>setWlText(e.target.value)} placeholder="BTCEUR,ETHEUR"
              style={{padding:'8px', borderRadius:8, border:'1px solid #263159', background:'#0b1020', color:'#fff'}} />
          </label>

          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={onSave} disabled={saving}
              style={{padding:'8px 12px', borderRadius:10, border:'1px solid #263159', background:'#121a36', color:'#fff', cursor:'pointer'}}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            {saveMsg && <span className="muted">{saveMsg}</span>}
          </div>
        </div>
      </div>

      {/* Trades tabel */}
      <div className="kpi" style={{marginTop:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{margin:0}}>Recente transacties (EUR)</h2>
          <small className="muted">live via Supabase Realtime</small>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Tijd</th><th>Symbool</th><th>Richting</th><th>Aantal</th><th>Prijs (EUR)</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t=> {
                const p = (t.price_eur ?? null)
                const shown = (typeof p === 'number' && !Number.isNaN(p))
                  ? new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(p)
                  : (typeof t.price === 'number' ? t.price.toFixed(2) + (t.quote_ccy? ` ${t.quote_ccy}` : '') : '—')
                return (
                  <tr key={t.id}>
                    <td>{new Date(t.ts).toLocaleString('nl-NL')}</td>
                    <td>{t.symbol}</td>
                    <td><span className={`pill ${t.side==='buy'?'buy':'sell'}`}>{t.side}</span></td>
                    <td>{t.qty}</td>
                    <td>{shown}</td>
                  </tr>
                )
              })}
              {trades.length===0 && (
                <tr><td colSpan="5" className="muted">(nog geen transacties)</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
