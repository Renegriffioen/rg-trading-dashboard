import { NavLink } from "react-router-dom";
import { LayoutDashboard, Signal, LineChart, Boxes, Play, Settings, HelpCircle } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/signalen", label: "Signalen", icon: Signal },
  { to: "/backtests", label: "Backtests", icon: LineChart },
  { to: "/universe", label: "Universe", icon: Boxes },
  { to: "/jobs", label: "Jobs", icon: Play },
  { to: "/instellingen", label: "Instellingen", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export default function Sidebar() {
  return (
    <aside style={{width: 240, background: "#0f172a", color: "#e2e8f0", minHeight: "100vh", padding: 16, boxSizing: "border-box"}}>
      <div style={{fontWeight: 700, fontSize: 18, marginBottom: 16}}>Trading Dashboard</div>
      <nav style={{display: "grid", gap: 6}}>
        {nav.map(({to,label,icon:Icon}) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({isActive})=>({
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10,
              textDecoration: "none",
              color: isActive ? "#0f172a" : "#e2e8f0",
              background: isActive ? "#38bdf8" : "transparent"
            })}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{marginTop: 16, fontSize: 12, opacity: 0.7}}>
        © {new Date().getFullYear()} – NL / EUR
      </div>
    </aside>
  );
}
