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

  return (
    <div className="wrap">
      <h1 style={{margin:'10px 0'}}>📈 Handelsdashboard</h1>

      <div className="muted" style={{marginBottom:8}}>
        {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
          <div className="err">Omgeving ontbreekt: zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY</div>
        )}
        {(tradesErr || eqErr || sigErr) && (
          <div className="err">Supabase-fout of tabellen nog niet aanwezig: voer de SQL-stappen uit. ({tradesErr || eqErr || sigErr})</div>
        )}
      </div>

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
