import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

export default function Signalen() {
  const [rows, setRows] = useState([]);

  useEffect(()=>{(async()=>{
    const { data, error } = await supabase
      .from("signals")
      .select("ts,symbol,side,confidence,reason,agent")
      .order("ts", { ascending: false })
      .limit(100);
    if (!error) setRows(data || []);
  })();},[]);

  const th = { textAlign:"left", padding:"10px 12px", color:"#0f172a", fontWeight:700, background:"#e2e8f0" };
  const td = { padding:"10px 12px", color:"#0f172a", borderTop:"1px solid #e5e7eb" };

  return (
    <div style={{color:"#0f172a"}}>
      <h1>Signalen (laatste 100)</h1>
      <div style={{overflowX:"auto", background:"#ffffff", border:"1px solid #e5e7eb", borderRadius:12}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th style={th}>Datum</th>
              <th style={th}>Agent</th>
              <th style={th}>Instrument</th>
              <th style={th}>Kant</th>
              <th style={th}>Conf.</th>
              <th style={th}>Reden</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td style={td}>{r.ts?.slice(0,19).replace("T"," ")}</td>
                <td style={td}>{r.agent}</td>
                <td style={td}>{r.symbol}</td>
                <td style={td}>{r.side}</td>
                <td style={td}>{(r.confidence??0).toFixed(2)}</td>
                <td style={td}>{r.reason}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td style={td} colSpan={6}>Geen data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
