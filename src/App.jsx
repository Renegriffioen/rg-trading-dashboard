// file: src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Signalen from "./pages/Signalen";
import Backtests from "./pages/Backtests";
import Universe from "./pages/Universe";
import Jobs from "./pages/Jobs";
import Instellingen from "./pages/Instellingen";
import Help from "./pages/Help";

export default function App(){
  return (
    <BrowserRouter>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "100vh",
          background: "#f8fafc" // licht grijsblauw
        }}
      >
        <Sidebar />
        <main
          style={{
            padding: 24,
            color: "#0f172a",       // <<< donkere tekstkleur (Slate-900)
            background: "transparent"
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard/>}/>
            <Route path="/signalen" element={<Signalen/>}/>
            <Route path="/backtests" element={<Backtests/>}/>
            <Route path="/universe" element={<Universe/>}/>
            <Route path="/jobs" element={<Jobs/>}/>
            <Route path="/instellingen" element={<Instellingen/>}/>
            <Route path="/help" element={<Help/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
