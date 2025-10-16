// file: src/pages/Backtests.jsx
import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

const box = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  overflowX: "auto"
};
const th = {
  padding: "12px 16px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f1f5f9",
  fontWeight: 600
};
const td = { padding: "12px 16px", borderTop: "1px solid #eef2f7" };

export default function Backtests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("backtest_runs")
        .select(`
          run_id, created_at, agent, exchange, symbols, timeframe,
          backtest_metrics ( sharpe, gross_return, max_drawdown, trades_count )
        `) // LEFT JOIN → rijen zonder metrics blijven zichtbaar
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("supabase backtests error:", error);
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    })();
  }, []);

  const fmtPct = (v) =>
    v == null || Number.isNaN(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;
  const fmtNum = (v, d = 2) =>
    v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(d);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Backtests</h1>

      <div style={box}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Datum</th>
              <th style={th}>Agent</th>
              <th style={th}>Exchange/Bron</th>
              <th style={th}>Symbols</th>
              <th style={th}>TF/Interval</th>
              <th style={th}>Sharpe</th>
              <th style={th}>Rendement</th>
              <th style={th}>Max DD</th>
              <th style={th}>Trades</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = Array.isArray(r.backtest_metrics)
                ? r.backtest_metrics[0]
                : r.backtest_metrics || {};
              const symbols = Array.isArray(r.symbols) ? r.symbols.join(", ") : r.symbols;

              return (
                <tr key={r.run_id}>
                  <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={td}>{r.agent}</td>
                  <td style={td}>{r.exchange || "—"}</td>
                  <td style={td}>{symbols || "—"}</td>
                  <td style={td}>{r.timeframe || "—"}</td>
                  <td style={td}>{fmtNum(m?.sharpe)}</td>
                  <td style={td}>{fmtPct(m?.gross_return)}</td>
                  <td style={td}>{fmtPct(m?.max_drawdown)}</td>
                  <td style={td}>{m?.trades_count ?? "—"}</td>
                </tr>
              );
            })}

            {!loading && rows.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: "center" }} colSpan={9}>
                  Geen backtests gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
