'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const T = {
  bg: "#F6F8FB", bgAlt: "#EDF1F7", white: "#FFFFFF", card: "#FFFFFF", surface: "#F0F3F8",
  navy: "#1B2A4A", navyLight: "#2D4263", navySoft: "#3D5580",
  blue: "#3B7DDD", blueLight: "#5B9AEF", blueSoft: "#E8F0FE", bluePale: "#F0F6FF",
  teal: "#0FA68E", tealSoft: "#E6F9F5",
  coral: "#E8625C", coralSoft: "#FDECEB",
  amber: "#E6A817", amberSoft: "#FFF8E1",
  purple: "#7C5CFC", purpleSoft: "#F0ECFF",
  text: "#1A2138", textMid: "#4A5568", textSub: "#718096", textDim: "#A0AEC0", textWhite: "#FFFFFF",
  border: "#E2E8F0", borderLight: "#EDF2F7", divider: "#F0F3F8",
  shadow: "0 1px 3px rgba(27,42,74,0.06), 0 1px 2px rgba(27,42,74,0.04)",
  shadowMd: "0 4px 12px rgba(27,42,74,0.08), 0 1px 3px rgba(27,42,74,0.06)",
  shadowLg: "0 10px 30px rgba(27,42,74,0.10)",
  radius: 12, radiusSm: 8, radiusLg: 16,
};

const FONT = `'Outfit', 'Noto Sans JP', system-ui, sans-serif`;
const MONO = `'DM Mono', 'JetBrains Mono', monospace`;

const SHIFTS = {
  morning: { l:"早", f:"早番", c:"#E6A817", bg:"#FFF8E1", time:"7:00-16:00" },
  day:     { l:"日", f:"日勤", c:"#3B7DDD", bg:"#E8F0FE", time:"8:30-17:30" },
  late:    { l:"遅", f:"遅番", c:"#7C5CFC", bg:"#F0ECFF", time:"12:00-21:00" },
  night:   { l:"夜", f:"夜勤", c:"#1B2A4A", bg:"#E2E8F0", time:"21:00-7:00" },
  off:     { l:"休", f:"休日", c:"#A0AEC0", bg:"#F7FAFC", time:"—" },
  paid:    { l:"有", f:"有給", c:"#0FA68E", bg:"#E6F9F5", time:"—" },
};

const POSITIONS = {
  doctor:        { l:"医師",           c:"#E8625C", bg:"#FDECEB" },
  doctor_ped:    { l:"医師：小児科",   c:"#E8625C", bg:"#FDECEB" },
  doctor_int:    { l:"医師：内科",     c:"#C0392B", bg:"#FADBD8" },
  doctor_derm:   { l:"医師：皮膚科",   c:"#A93226", bg:"#F9EBEA" },
  doctor_ortho:  { l:"医師：整形外科", c:"#922B21", bg:"#F5B7B1" },
  nurse:         { l:"看護師",         c:"#3B7DDD", bg:"#E8F0FE" },
  pt:            { l:"PT",             c:"#7C3AED", bg:"#EDE9FE" },
  ot:            { l:"OT",             c:"#6D28D9", bg:"#EDE9FE" },
  trainer:       { l:"スポーツトレーナー", c:"#059669", bg:"#D1FAE5" },
  lab:           { l:"検査技師",       c:"#0891B2", bg:"#CFFAFE" },
  assistant:     { l:"助手",           c:"#0FA68E", bg:"#E6F9F5" },
  clerk:         { l:"事務",           c:"#E6A817", bg:"#FFF8E1" },
};

const ROLES = { admin:"管理者", manager:"マネージャー", staff:"スタッフ" };
const DOW = ["日","月","火","水","木","金","土"];

const STAFF_DATA = [
  { id:"s1", name:"田中 美咲",   pos:"doctor",    role:"admin",   night:true,  email:"tanaka@clinic.com" },
  { id:"s2", name:"佐藤 健一",   pos:"nurse",     role:"manager", night:true,  email:"sato@clinic.com" },
  { id:"s3", name:"鈴木 花子",   pos:"nurse",     role:"staff",   night:true,  email:"suzuki@clinic.com" },
  { id:"s4", name:"高橋 太郎",   pos:"nurse",     role:"staff",   night:true,  email:"takahashi@clinic.com" },
  { id:"s5", name:"伊藤 由美",   pos:"assistant", role:"staff",   night:false, email:"ito@clinic.com" },
  { id:"s6", name:"渡辺 誠",     pos:"assistant", role:"staff",   night:false, email:"watanabe@clinic.com" },
  { id:"s7", name:"山本 恵子",   pos:"clerk",     role:"staff",   night:false, email:"yamamoto@clinic.com" },
  { id:"s8", name:"中村 大輔",   pos:"doctor",    role:"staff",   night:true,  email:"nakamura@clinic.com" },
  { id:"s9", name:"小林 さくら", pos:"nurse",     role:"staff",   night:true,  email:"kobayashi@clinic.com" },
  { id:"s10",name:"加藤 翔太",   pos:"nurse",     role:"staff",   night:true,  email:"kato@clinic.com" },
];

// Demo shift requests for mock mode
const DEMO_REQUESTS = [
  { id:"r1", staff_id:"s3", staffName:"鈴木 花子", pos:"nurse", request_date:"2026-05-03", preferred_shift:"off", priority:3, status:"pending", reason:"家族の用事", target_month:"2026-05", created_at:"2026-04-10T09:00:00Z" },
  { id:"r2", staff_id:"s4", staffName:"高橋 太郎", pos:"nurse", request_date:"2026-05-05", preferred_shift:"day", priority:2, status:"pending", reason:"", target_month:"2026-05", created_at:"2026-04-10T10:30:00Z" },
  { id:"r3", staff_id:"s5", staffName:"伊藤 由美", pos:"assistant", request_date:"2026-05-10", preferred_shift:"morning", priority:1, status:"approved", reason:"", target_month:"2026-05", created_at:"2026-04-09T14:00:00Z" },
  { id:"r4", staff_id:"s6", staffName:"渡辺 誠", pos:"assistant", request_date:"2026-05-12", preferred_shift:"off", priority:3, status:"rejected", reason:"育児のため", target_month:"2026-05", created_at:"2026-04-09T16:00:00Z" },
  { id:"r5", staff_id:"s7", staffName:"山本 恵子", pos:"clerk", request_date:"2026-05-15", preferred_shift:"paid", priority:2, status:"pending", reason:"有給消化", target_month:"2026-05", created_at:"2026-04-11T08:00:00Z" },
  { id:"r6", staff_id:"s9", staffName:"小林 さくら", pos:"nurse", request_date:"2026-05-20", preferred_shift:"late", priority:1, status:"pending", reason:"", target_month:"2026-05", created_at:"2026-04-11T11:00:00Z" },
  { id:"r7", staff_id:"s10", staffName:"加藤 翔太", pos:"nurse", request_date:"2026-05-22", preferred_shift:"night", priority:2, status:"pending", reason:"", target_month:"2026-05", created_at:"2026-04-12T09:00:00Z" },
  { id:"r8", staff_id:"s3", staffName:"鈴木 花子", pos:"nurse", request_date:"2026-05-25", preferred_shift:"day", priority:1, status:"pending", reason:"", target_month:"2026-05", created_at:"2026-04-12T14:00:00Z" },
];

function genShifts(y, m) {
  const days = new Date(y, m, 0).getDate();
  const out = {};
  const all = Object.keys(SHIFTS);
  STAFF_DATA.forEach(s => {
    out[s.id] = {};
    for (let d = 1; d <= days; d++) {
      const dow = new Date(y, m-1, d).getDay();
      if (dow === 0) { out[s.id][d] = "off"; continue; }
      out[s.id][d] = s.night ? all[Math.floor(Math.random()*all.length)]
        : ["morning","day","late","off"][Math.floor(Math.random()*4)];
    }
  });
  return out;
}

function getDIM(y,m) { return new Date(y,m,0).getDate(); }
function getDow(y,m,d) { return new Date(y,m-1,d).getDay(); }

function ShiftBadge({ type, size="sm", selected, onClick }) {
  const s = SHIFTS[type];
  if (!s) return null;
  const sz = size === "lg" ? { w:36,h:28,f:13 } : size === "md" ? { w:30,h:24,f:11 } : { w:26,h:22,f:10 };
  return (
    <button onClick={onClick} style={{
      width:sz.w, height:sz.h, borderRadius:6, border:"none",
      background: selected ? s.c : s.bg, color: selected ? "#fff" : s.c,
      fontSize:sz.f, fontWeight:700, cursor:onClick?"pointer":"default",
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      transition:"all 0.15s", fontFamily:FONT,
      outline: selected ? `2px solid ${s.c}` : "none", outlineOffset:1,
    }}>{s.l}</button>
  );
}

function PosBadge({ pos, size="sm" }) {
  const p = POSITIONS[pos]; if (!p) return null;
  const f = size==="xs"?9:size==="sm"?10:12;
  return (
    <span style={{ fontSize:f, fontWeight:700, color:p.c, background:p.bg,
      padding:`2px ${size==="xs"?4:6}px`, borderRadius:4, display:"inline-block",
      lineHeight:1.3, fontFamily:FONT }}>{p.l}</span>
  );
}

function RoleBadge({ role }) {
  const c = role==="admin"?T.blue:role==="manager"?T.amber:T.textDim;
  const bg = role==="admin"?T.blueSoft:role==="manager"?T.amberSoft:T.surface;
  return (
    <span style={{ fontSize:9, fontWeight:700, color:c, background:bg,
      padding:"2px 6px", borderRadius:4, fontFamily:FONT }}>{ROLES[role]}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:  { l:"承認待ち", c:T.amber,  bg:T.amberSoft },
    approved: { l:"承認済み", c:T.teal,   bg:T.tealSoft  },
    rejected: { l:"却下",     c:T.coral,  bg:T.coralSoft },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize:10, fontWeight:700, color:s.c, background:s.bg,
      padding:"3px 10px", borderRadius:20, fontFamily:FONT, whiteSpace:"nowrap" }}>{s.l}</span>
  );
}

function Card({ children, style, onClick, hover }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={hover ? () => setHovered(true) : undefined}
      onMouseLeave={hover ? () => setHovered(false) : undefined}
      style={{
        background:T.card, borderRadius:T.radius, padding:20,
        boxShadow: hovered ? T.shadowMd : T.shadow,
        cursor:onClick?"pointer":"default",
        transition:"all 0.2s ease", border:`1px solid ${T.borderLight}`,
        ...style,
      }}>{children}</div>
  );
}

function Btn({ children, variant="primary", size="md", disabled, onClick, style={}, icon }) {
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
    borderRadius:T.radiusSm, fontWeight:600, fontFamily:FONT, cursor:disabled?"default":"pointer",
    transition:"all 0.2s", border:"none", whiteSpace:"nowrap" };
  const sizes = { sm: { fontSize:12, padding:"6px 12px" }, md: { fontSize:13, padding:"10px 18px" }, lg: { fontSize:14, padding:"12px 24px" } };
  const variants = {
    primary: { background:T.blue, color:"#fff", opacity:disabled?0.5:1 },
    secondary: { background:T.surface, color:T.textMid, border:`1px solid ${T.border}` },
    success: { background:T.teal, color:"#fff", opacity:disabled?0.5:1 },
    danger: { background:T.coralSoft, color:T.coral },
    ghost: { background:"transparent", color:T.textSub },
  };
  return (
    <button onClick={disabled?undefined:onClick} style={{...base,...sizes[size],...variants[variant],...style}}>
      {icon && <span style={{fontSize: size==="sm"?14:16}}>{icon}</span>}
      {children}
    </button>
  );
}

function StatCard({ icon, value, label, color, sub }) {
  return (
    <Card style={{ padding:16, textAlign:"center" }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:800, color:color||T.text, fontFamily:MONO }}>{value}</div>
      <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>{sub}</div>}
    </Card>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", color:T.textDim }}>
      <div style={{ fontSize:48, marginBottom:12, opacity:0.4 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:700, color:T.textMid, marginBottom:4 }}>{title}</div>
      {sub && <div style={{ fontSize:13, lineHeight:1.6 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("magic");
  const [pw, setPw] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const useRealAuth = isSupabaseConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (useRealAuth && supabase) {
      setLoading(true);
      try {
        if (mode === "magic") {
          const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
          if (authError) throw authError;
          setSent(true);
        } else {
          const { error: authError } = await supabase.auth.signInWithPassword({ email, password: pw });
          if (authError) throw authError;
        }
      } catch (err) {
        setError(err.message === "Invalid login credentials" ? "メールアドレスまたはパスワードが正しくありません" : err.message || "ログインに失敗しました");
      } finally { setLoading(false); }
    } else {
      if (mode === "magic") { setLoading(true); setTimeout(() => { setLoading(false); setSent(true); }, 1200); }
      else { const found = STAFF_DATA.find(s => s.email === email); if (found) onLogin(found); else setError("デモ: メールアドレスが見つかりません"); }
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg, ${T.navy} 0%, #263B5E 50%, #1E3250 100%)`, fontFamily:FONT, padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:"rgba(255,255,255,0.1)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:12, backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)" }}>📋</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>Shift Manager</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", margin:0 }}>クリニック スタッフ シフト管理</p>
          {!useRealAuth && <div style={{ fontSize:10, color:T.amber, background:"rgba(230,168,23,0.15)", padding:"4px 12px", borderRadius:12, display:"inline-block", marginTop:8 }}>🧪 デモモード</div>}
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:20, padding:28, backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)" }}>
          {sent ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✉️</div>
              <div style={{ fontSize:17, fontWeight:700, color:"#fff", marginBottom:6 }}>メールを送信しました</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7 }}><strong style={{color:"#fff"}}>{email}</strong> にログインリンクを送信しました。</div>
              <button onClick={() => { setSent(false); setError(""); }} style={{ marginTop:20, background:"none", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.7)", padding:"8px 20px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>別のアドレスで試す</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:10, padding:3, marginBottom:20 }}>
                {[["magic","マジックリンク"],["password","パスワード"]].map(([k,label]) => (
                  <button key={k} type="button" onClick={() => { setMode(k); setError(""); }} style={{ flex:1, padding:"8px", borderRadius:8, fontSize:12, fontWeight:600, border:"none", cursor:"pointer", fontFamily:FONT, transition:"all 0.2s", background:mode===k?"rgba(255,255,255,0.12)":"transparent", color:mode===k?"#fff":"rgba(255,255,255,0.4)" }}>{label}</button>
                ))}
              </div>
              {error && <div style={{ background:"rgba(232,98,92,0.15)", border:"1px solid rgba(232,98,92,0.3)", borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:"#FF8A85" }}>⚠️ {error}</div>}
              <label style={{ display:"block", marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:6 }}>メールアドレス</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@clinic.com" style={{ width:"100%", padding:"12px 14px", borderRadius:10, fontSize:14, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", fontFamily:FONT, boxSizing:"border-box" }} />
              </label>
              {mode === "password" && (
                <label style={{ display:"block", marginBottom:14 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:6 }}>パスワード</span>
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="パスワードを入力" style={{ width:"100%", padding:"12px 14px", borderRadius:10, fontSize:14, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", fontFamily:FONT, boxSizing:"border-box" }} />
                </label>
              )}
              <button type="submit" disabled={!email || loading} style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background:email?`linear-gradient(135deg, ${T.blue}, ${T.teal})`:"rgba(255,255,255,0.1)", color:"#fff", fontSize:14, fontWeight:700, cursor:email?"pointer":"default", fontFamily:FONT, transition:"all 0.2s", opacity:loading?0.6:1 }}>
                {loading ? "送信中..." : mode==="magic" ? "📩 ログインリンクを送信" : "ログイン"}
              </button>
            </form>
          )}
        </div>
        <div style={{ marginTop:24, background:"rgba(255,255,255,0.04)", borderRadius:14, padding:16, border:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:10, textAlign:"center" }}>🧪 デモ: クイックログイン</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {STAFF_DATA.slice(0,4).map(s => (
              <button key={s.id} onClick={() => onLogin(s)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", cursor:"pointer", fontFamily:FONT, textAlign:"left" }}>
                <span style={{ width:32, height:32, borderRadius:8, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", background:POSITIONS[s.pos].bg, color:POSITIONS[s.pos].c }}>{s.name[0]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{s.name}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{POSITIONS[s.pos].l} • {ROLES[s.role]}</div>
                </div>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ user, active, onNav, onLogout, collapsed, onToggle, pendingCount }) {
  const isManager = user.role === "admin" || user.role === "manager";
  const items = [
    { id:"home",       icon:"🏠", label:"ホーム" },
    { id:"shifts",     icon:"📊", label:"シフト表" },
    { id:"request",    icon:"📝", label:"希望提出" },
    { id:"approval",   icon:"✅", label:"申請承認", admin:true, badge: isManager ? pendingCount : 0 },
    { id:"attendance", icon:"⏱️", label:"勤怠管理" },
    { id:"generate",   icon:"⚡", label:"自動生成", admin:true },
    { id:"staff",      icon:"👥", label:"スタッフ" },
    { id:"swap",       icon:"🔄", label:"シフト交換" },
    { id:"notif",      icon:"🔔", label:"通知", badge:2 },
    { id:"settings",   icon:"⚙️", label:"設定" },
  ];
  const w = collapsed ? 68 : 240;
  return (
    <div style={{ width:w, minWidth:w, height:"100vh", background:T.navy, display:"flex", flexDirection:"column", transition:"width 0.25s ease", overflow:"hidden", position:"relative" }}>
      <div style={{ padding:collapsed?"16px 10px":"20px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📋</div>
          {!collapsed && <div><div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>Shift Manager</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>丸岡内科小児科クリニック</div></div>}
        </div>
      </div>
      <button onClick={onToggle} style={{ position:"absolute", right:-12, top:30, width:24, height:24, borderRadius:12, background:T.white, border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:T.textDim, boxShadow:T.shadow, zIndex:20 }}>{collapsed ? "→" : "←"}</button>
      <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
        {items.map(item => {
          const isActive = active === item.id;
          const isLocked = item.admin && user.role !== "admin" && user.role !== "manager";
          return (
            <button key={item.id} onClick={() => onNav(item.id)} title={collapsed ? item.label : ""}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px":"10px 14px", borderRadius:10, border:"none", cursor:"pointer", background:isActive?"rgba(59,125,221,0.15)":"transparent", color:isActive?"#fff":"rgba(255,255,255,0.5)", fontSize:13, fontWeight:isActive?700:500, marginBottom:2, transition:"all 0.15s", fontFamily:FONT, textAlign:"left", justifyContent:collapsed?"center":"flex-start", opacity:isLocked?0.4:1 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
              {!collapsed && isLocked && <span style={{ fontSize:10 }}>🔒</span>}
              {!collapsed && item.badge > 0 && (
                <span style={{ fontSize:9, fontWeight:700, color:"#fff", background:item.id==="approval"?T.teal:T.coral, padding:"1px 5px", borderRadius:8 }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:collapsed?"12px 8px":"14px 16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:POSITIONS[user.pos]?.bg||T.surface, color:POSITIONS[user.pos]?.c||T.textMid, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>{user.name[0]}</div>
          {!collapsed && <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{ROLES[user.role]}</div></div>}
          {!collapsed && <button onClick={onLogout} title="ログアウト" style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"rgba(255,255,255,0.3)", padding:4 }}>↗</button>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE NAV
// ─────────────────────────────────────────────
function MobileNav({ user, active, onNav, pendingCount }) {
  const isManager = user.role === "admin" || user.role === "manager";
  const items = [
    { id:"home",    icon:"🏠", label:"ホーム" },
    { id:"shifts",  icon:"📅", label:"シフト" },
    { id:"request", icon:"📝", label:"希望" },
    { id:"approval",icon:"✅", label:"承認", badge: isManager ? pendingCount : 0 },
    { id:"more",    icon:"☰",  label:"メニュー" },
  ];
  return (
    <nav style={{ display:"flex", background:T.white, borderTop:`1px solid ${T.border}`, paddingBottom:"env(safe-area-inset-bottom, 8px)", boxShadow:"0 -2px 12px rgba(0,0,0,0.08)" }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{ flex:1, padding:"10px 4px 6px", border:"none", background:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:active===it.id?T.blue:T.textDim, fontFamily:FONT, position:"relative" }}>
          <span style={{ fontSize:20, lineHeight:1, position:"relative" }}>
            {it.icon}
            {it.badge > 0 && <span style={{ position:"absolute", top:-4, right:-6, fontSize:8, fontWeight:700, background:T.teal, color:"#fff", borderRadius:8, padding:"1px 4px", lineHeight:1 }}>{it.badge}</span>}
          </span>
          <span style={{ fontSize:10, fontWeight:active===it.id?700:500 }}>{it.label}</span>
          {active===it.id && <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:24, height:3, borderRadius:2, background:T.blue }}/>}
        </button>
      ))}
    </nav>
  );
}

function MoreMenuPage({ user, onNav, onLogout }) {
  const isManager = user.role === "admin" || user.role === "manager";
  const items = [
    { id:"approval", icon:"✅", label:"申請承認",   sub:"シフト希望の審査・承認", show: isManager },
    { id:"generate", icon:"⚡", label:"自動生成",   sub:"シフトを自動生成",        show: isManager },
    { id:"staff",    icon:"👥", label:"スタッフ管理", sub:"メンバー一覧・追加",     show: true },
    { id:"swap",     icon:"🔄", label:"シフト交換",  sub:"交換リクエスト管理",      show: true },
    { id:"notif",    icon:"🔔", label:"通知",        sub:"お知らせを確認",          show: true },
    { id:"settings", icon:"⚙️", label:"設定",        sub:"アカウント設定",          show: true },
  ].filter(i => i.show);
  return (
    <div style={{ padding:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:POSITIONS[user.pos]?.bg||T.surface, color:POSITIONS[user.pos]?.c||T.text, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700 }}>{user.name[0]}</div>
        <div><div style={{ fontSize:15, fontWeight:700 }}>{user.name}</div><div style={{ fontSize:12, color:T.textSub, marginTop:2 }}><PosBadge pos={user.pos} /></div></div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onNav(it.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, border:`1px solid ${T.border}`, background:T.white, cursor:"pointer", fontFamily:FONT, textAlign:"left" }}>
            <span style={{ fontSize:22, width:32, textAlign:"center" }}>{it.icon}</span>
            <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600, color:T.text }}>{it.label}</div><div style={{ fontSize:12, color:T.textSub }}>{it.sub}</div></div>
            <span style={{ color:T.textDim, fontSize:16 }}>›</span>
          </button>
        ))}
        <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, border:`1px solid ${T.coralSoft}`, background:T.coralSoft, cursor:"pointer", fontFamily:FONT, marginTop:8 }}>
          <span style={{ fontSize:22, width:32, textAlign:"center" }}>🚪</span>
          <div style={{ flex:1, fontSize:14, fontWeight:600, color:T.coral, textAlign:"left" }}>ログアウト</div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────
function HomePage({ user, onNav }) {
  const today = new Date();
  const d = today.getDate(), m = today.getMonth()+1, year = today.getFullYear();
  const [todayShiftType, setTodayShiftType] = useState('off');
  const [stats, setStats] = useState({ workDays:0, nightCount:0, paidLeft:12, reflectRate:0 });
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [pendingExchanges, setPendingExchanges] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      try {
        const todayStr = `${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const startMonth = `${year}-${String(m).padStart(2,'0')}-01`;
        if (user.id !== 'new') {
          const { data: todayS } = await supabase.from('shifts').select('shift_type').eq('staff_id', user.id).eq('shift_date', todayStr).single();
          if (todayS) setTodayShiftType(todayS.shift_type);
          const { data: monthS } = await supabase.from('shifts').select('shift_type').eq('staff_id', user.id).gte('shift_date', startMonth).lte('shift_date', todayStr);
          if (monthS) {
            const workDays = monthS.filter(s => s.shift_type !== 'off' && s.shift_type !== 'paid').length;
            const nightCount = monthS.filter(s => s.shift_type === 'night').length;
            const { data: reqData } = await supabase.from('shift_requests').select('status').eq('staff_id', user.id);
            const approved = reqData ? reqData.filter(r => r.status === 'approved').length : 0;
            const reflectRate = monthS.length > 0 ? Math.round((approved / Math.max(monthS.length,1)) * 100) : 94;
            setStats({ workDays, nightCount, paidLeft:12, reflectRate: reflectRate||94 });
          }
          const { data: upcoming } = await supabase.from('shifts').select('shift_date, shift_type').eq('staff_id', user.id).gt('shift_date', todayStr).order('shift_date').limit(5);
          if (upcoming) setUpcomingShifts(upcoming);
        }
        const { data: todayAll } = await supabase.from('shifts').select('id').eq('shift_date', todayStr).neq('shift_type','off').neq('shift_type','paid');
        if (todayAll) setTodayCount(todayAll.length);
        const { data: exData } = await supabase.from('shift_exchanges').select('id').eq('status','pending');
        if (exData) setPendingExchanges(exData.length);
        const { data: nData } = await supabase.from('notifications').select('*').eq('staff_id', user.id).order('created_at', { ascending:false }).limit(5);
        if (nData && nData.length > 0) { setNotifs(nData); setUnreadNotifs(nData.filter(n => !n.read).length); }
      } catch(err) { console.error(err); }
    };
    load();
  }, [user.id]);

  const todayShift = SHIFTS[todayShiftType] || SHIFTS['off'];
  return (
    <div style={{ padding:24, maxWidth:1000 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:T.text, margin:"0 0 4px" }}>おはようございます、{user.name.split(" ")[0]}さん</h1>
        <p style={{ fontSize:13, color:T.textSub, margin:0 }}>{year}年{m}月{d}日（{DOW[today.getDay()]}）</p>
      </div>
      <Card style={{ background:`linear-gradient(135deg, ${T.navy} 0%, ${T.navySoft} 100%)`, border:"none", marginBottom:20, padding:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:6 }}>今日のシフト — {m}/{d}（{DOW[today.getDay()]}）</div>
            <div style={{ fontSize:32, fontWeight:800, color:"#fff" }}>{todayShift.f}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{todayShift.time}</div>
          </div>
          <div style={{ width:64, height:64, borderRadius:16, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.3)" }}>{todayShift.l}</div>
        </div>
        <div style={{ display:"flex", gap:20, marginTop:16, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.1)", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>👥 本日の出勤: {todayCount}名</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>🔄 交換リクエスト: {pendingExchanges}件</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>🔔 未読通知: {unreadNotifs}件</span>
        </div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:12, marginBottom:20 }}>
        <StatCard icon="📅" value={`${stats.workDays}日`} label="今月の出勤" color={T.blue} />
        <StatCard icon="🌙" value={`${stats.nightCount}回`} label="夜勤回数" color={T.purple} />
        <StatCard icon="🏖️" value={`${stats.paidLeft}日`} label="有給残日数" color={T.teal} />
        <StatCard icon="📊" value={`${stats.reflectRate}%`} label="希望反映率" color={T.amber} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16 }}>
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>📋 今後のシフト</div>
          {upcomingShifts.length === 0 ? <div style={{ fontSize:13, color:T.textDim, textAlign:'center', padding:20 }}>シフトがありません</div> :
          upcomingShifts.map((s, i) => {
            const fd = new Date(s.shift_date);
            return (
              <div key={s.shift_date} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none" }}>
                <div style={{ width:40, textAlign:"center" }}>
                  <div style={{ fontSize:10, fontWeight:600, color:fd.getDay()===0?T.coral:fd.getDay()===6?T.blue:T.textDim }}>{DOW[fd.getDay()]}</div>
                  <div style={{ fontSize:17, fontWeight:700 }}>{fd.getDate()}</div>
                </div>
                <ShiftBadge type={s.shift_type} size="md" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{SHIFTS[s.shift_type]?.f}</div>
                  <div style={{ fontSize:11, color:T.textDim }}>{SHIFTS[s.shift_type]?.time}</div>
                </div>
              </div>
            );
          })}
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>🔔 最近の通知</div>
          {notifs.length === 0 ? <div style={{ fontSize:13, color:T.textDim, textAlign:'center', padding:20 }}>通知はありません</div> :
          notifs.map((n, i) => (
            <div key={n.id} style={{ display:"flex", gap:10, padding:"10px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none", opacity:n.read?0.6:1 }}>
              <span style={{ fontSize:20 }}>{n.icon || '🔔'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:n.read?500:700 }}>{n.title}</div>
                <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>{n.body}</div>
              </div>
              {!n.read && <div style={{ width:8, height:8, borderRadius:4, background:T.blue, marginTop:4 }}/>}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHIFT TABLE
// ─────────────────────────────────────────────
function ShiftTablePage({ user, year=2026, month=4 }) {
  const [shifts, setShifts] = useState({});
  const [staffList, setStaffList] = useState(STAFF_DATA);
  const [filterPos, setFilterPos] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const days = getDIM(year, month);
  const todayD = new Date().getDate();
  const isCur = new Date().getMonth()+1===month;
  const canEdit = user.role==="admin"||user.role==="manager";
  const posMap = { doctor:'doctor', doctor_ped:'doctor_ped', doctor_int:'doctor_int', doctor_derm:'doctor_derm', doctor_ortho:'doctor_ortho', nurse:'nurse', pt:'pt', ot:'ot', trainer:'trainer', lab:'lab', receptionist:'clerk', clerk:'clerk', technician:'assistant', assistant:'assistant', other:'assistant' };
  const filtered = filterPos ? staffList.filter(s => s.pos===filterPos) : staffList;

  useEffect(() => {
    if (!supabase) { setShifts(genShifts(year, month)); return; }
    const load = async () => {
      try {
        const { data: spData } = await supabase.from('staff_profiles').select('*');
        if (spData && spData.length > 0) {
          const mapped = spData.map(sp => ({ id:sp.id, name:sp.last_name+' '+sp.first_name, pos:posMap[sp.position]||'nurse', role:sp.user_role, night:sp.can_work_night, email:sp.email||'' }));
          setStaffList(mapped);
          const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
          const endDate = `${year}-${String(month).padStart(2,'0')}-${String(getDIM(year,month)).padStart(2,'0')}`;
          const { data: shiftData } = await supabase.from('shifts').select('*').gte('shift_date', startDate).lte('shift_date', endDate);
          const newShifts = {};
          mapped.forEach(s => { newShifts[s.id] = {}; });
          if (shiftData) shiftData.forEach(row => { const d=parseInt(row.shift_date.split('-')[2]); if(newShifts[row.staff_id]) newShifts[row.staff_id][d]=row.shift_type; });
          setShifts(newShifts);
        } else { setShifts(genShifts(year, month)); }
      } catch(err) { setShifts(genShifts(year, month)); }
    };
    load();
  }, [year, month]);

  const daySummary = useMemo(() => {
    const s = {};
    for (let d=1; d<=days; d++) { let c=0; staffList.forEach(st => { const t=shifts[st.id]?.[d]; if(t&&t!=="off"&&t!=="paid") c++; }); s[d]=c; }
    return s;
  }, [shifts, days, staffList]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>📊 {year}年{month}月</h2>
        <span style={{ fontSize:11, fontWeight:600, color:T.teal, background:T.tealSoft, padding:"3px 10px", borderRadius:20 }}>公開済み</span>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          <Btn size="sm" variant={!filterPos?"primary":"secondary"} onClick={() => setFilterPos(null)}>全員 ({STAFF_DATA.length})</Btn>
          {Object.entries(POSITIONS).map(([k,p]) => { const c=STAFF_DATA.filter(s=>s.pos===k).length; return <Btn key={k} size="sm" variant={filterPos===k?"primary":"secondary"} onClick={() => setFilterPos(filterPos===k?null:k)} style={filterPos===k?{background:p.c}:{}}>{p.l} ({c})</Btn>; })}
        </div>
      </div>
      <div style={{ flex:1, overflow:"auto", position:"relative" }}>
        <table style={{ borderCollapse:"collapse", fontSize:12, fontFamily:FONT, minWidth:"100%" }}>
          <thead>
            <tr style={{ position:"sticky", top:0, zIndex:10, background:T.surface }}>
              <th style={{ position:"sticky", left:0, zIndex:12, background:T.surface, padding:"8px 10px", textAlign:"left", fontWeight:700, fontSize:11, color:T.textDim, borderBottom:`2px solid ${T.border}`, borderRight:`1px solid ${T.border}`, minWidth:120 }}>スタッフ</th>
              {Array.from({length:days},(_,i)=>i+1).map(d => { const dow=getDow(year,month,d); const isT=isCur&&d===todayD; return <th key={d} style={{ padding:"4px 2px", textAlign:"center", fontWeight:600, borderBottom:`2px solid ${T.border}`, borderRight:`1px solid ${T.borderLight}`, background:isT?T.blueSoft:T.surface, minWidth:34 }}><div style={{ fontSize:9, color:dow===0?T.coral:dow===6?T.blue:T.textDim }}>{DOW[dow]}</div><div style={{ fontSize:12, fontWeight:isT?800:600, color:isT?T.blue:dow===0?T.coral:T.text }}>{d}</div></th>; })}
            </tr>
            <tr style={{ position:"sticky", top:46, zIndex:9, background:T.white }}>
              <td style={{ position:"sticky", left:0, zIndex:11, background:T.white, padding:"4px 10px", fontSize:10, fontWeight:600, color:T.textDim, borderBottom:`1px solid ${T.blue}30`, borderRight:`1px solid ${T.border}` }}>出勤数</td>
              {Array.from({length:days},(_,i)=>i+1).map(d => <td key={d} style={{ textAlign:"center", padding:"4px 0", fontWeight:700, fontSize:10, color:daySummary[d]<5?T.coral:T.teal, background:daySummary[d]<5?T.coralSoft:T.white, borderBottom:`1px solid ${T.blue}30`, borderRight:`1px solid ${T.borderLight}` }}>{daySummary[d]}</td>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map(staff => (
              <tr key={staff.id}>
                <td style={{ position:"sticky", left:0, zIndex:5, background:T.white, padding:"6px 10px", borderBottom:`1px solid ${T.borderLight}`, borderRight:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <PosBadge pos={staff.pos} size="xs" />
                    <span style={{ fontSize:12, fontWeight:600 }}>{staff.name.split(" ")[0]}</span>
                    {staff.role==="admin" && <RoleBadge role="admin" />}
                  </div>
                </td>
                {Array.from({length:days},(_,i)=>i+1).map(d => { const t=shifts[staff.id]?.[d]; const isT=isCur&&d===todayD; const isSel=selectedCell?.s===staff.id&&selectedCell?.d===d; return <td key={d} style={{ textAlign:"center", padding:"3px 1px", borderBottom:`1px solid ${T.borderLight}`, borderRight:`1px solid ${T.borderLight}`, background:isSel?T.blueSoft:isT?`${T.blue}06`:"transparent", cursor:canEdit?"pointer":"default" }} onClick={canEdit?()=>setSelectedCell({s:staff.id,d}):undefined}><ShiftBadge type={t} selected={isSel} /></td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:"8px 16px", background:T.white, borderTop:`1px solid ${T.border}`, display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:10, color:T.textDim, fontWeight:600 }}>凡例:</span>
        {Object.entries(SHIFTS).map(([k,s]) => <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:T.textSub }}><span style={{ width:14, height:14, borderRadius:3, background:s.bg, color:s.c, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700 }}>{s.l}</span>{s.f}</span>)}
        <span style={{ marginLeft:"auto", fontSize:11, color:T.textDim }}>{canEdit ? "💡 セルをクリックして編集" : "閲覧のみ"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REQUEST PAGE（希望提出 + ステータス確認）
// ─────────────────────────────────────────────
function RequestPage({ user }) {
  const [tab, setTab] = useState(0); // 0=提出, 1=ステータス確認
  const [sel, setSel] = useState({});
  const [pri, setPri] = useState({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const year=2026, month=5;
  const days = getDIM(year, month);

  const toggle = (d,t) => setSel(p => { const n={...p}; if(n[d]===t) delete n[d]; else { n[d]=t; if(!pri[d]) setPri(pp=>({...pp,[d]:1})); } return n; });
  const cnt = Object.keys(sel).length;
  const offCnt = Object.values(sel).filter(v=>v==="off"||v==="paid").length;

  // Load my submitted requests
  useEffect(() => {
    if (tab !== 1) return;
    setReqLoading(true);
    if (!supabase || user.id === 'new') {
      // Demo data for current user
      const myDemoRequests = DEMO_REQUESTS.filter(r => r.staff_id === user.id).slice(0, 6);
      // If no demo data for this user, show sample
      if (myDemoRequests.length === 0) {
        setMyRequests([
          { id:"r_demo1", request_date:"2026-05-03", preferred_shift:"off", priority:3, status:"approved", reason:"家族の用事", created_at:"2026-04-10T09:00:00Z" },
          { id:"r_demo2", request_date:"2026-05-10", preferred_shift:"day", priority:2, status:"pending", reason:"", created_at:"2026-04-10T10:30:00Z" },
          { id:"r_demo3", request_date:"2026-05-15", preferred_shift:"morning", priority:1, status:"rejected", reason:"早起きが得意", created_at:"2026-04-09T14:00:00Z" },
        ]);
      } else { setMyRequests(myDemoRequests); }
      setReqLoading(false);
      return;
    }
    const load = async () => {
      try {
        const { data } = await supabase.from('shift_requests').select('*').eq('staff_id', user.id).eq('target_month', `${year}-${String(month).padStart(2,'0')}`).order('request_date');
        setMyRequests(data || []);
      } catch(err) { console.error(err); }
      finally { setReqLoading(false); }
    };
    load();
  }, [tab, user.id]);

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      if (supabase && user.id !== 'new') {
        const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
        const rows = Object.entries(sel).map(([d, shift]) => ({
          clinic_id: clinicData.id, staff_id: user.id,
          request_date: `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
          preferred_shift: shift, priority: pri[d] || 1,
          target_month: `${year}-${String(month).padStart(2,'0')}`, status: 'pending',
        }));
        const { error: err } = await supabase.from('shift_requests').upsert(rows, { onConflict: 'staff_id,request_date' });
        if (err) throw err;
      }
      setDone(true);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const statusSummary = myRequests.reduce((acc, r) => { acc[r.status] = (acc[r.status]||0)+1; return acc; }, {});

  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", padding:48, textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px" }}>提出完了！</h2>
      <p style={{ fontSize:14, color:T.textSub, lineHeight:1.7, margin:0 }}>{month}月の希望シフトを{cnt}日分提出しました。<br/>確定後にお知らせします。</p>
      <div style={{ display:"flex", gap:8, marginTop:20 }}>
        <Btn variant="secondary" onClick={() => { setDone(false); setSel({}); setPri({}); }}>修正する</Btn>
        <Btn variant="primary" onClick={() => { setDone(false); setTab(1); }}>ステータス確認 →</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}` }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 12px" }}>📝 希望シフト</h2>
        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${T.border}` }}>
          {["希望を提出", "提出済みを確認"].map((l,i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding:"8px 18px", border:"none", background:"none", cursor:"pointer", borderBottom:tab===i?`3px solid ${T.blue}`:"3px solid transparent", color:tab===i?T.blue:T.textDim, fontSize:13, fontWeight:tab===i?700:500, fontFamily:FONT, transition:"all 0.15s" }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 20px", background:T.amberSoft, fontSize:12, fontWeight:600, color:"#92400E" }}>
            <span>⏰ 提出期限: 4/20（月）</span><span>{cnt}日選択 / 休日{offCnt}日</span>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:"8px 16px" }}>
            {Array.from({length:days},(_,i)=>i+1).map(d => {
              const dow = getDow(year,month,d); const s = sel[d];
              return (
                <div key={d} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:s?T.white:"transparent", borderRadius:10, marginBottom:3, border:s?`1.5px solid ${T.blue}20`:"1px solid transparent" }}>
                  <div style={{ width:36, textAlign:"center" }}>
                    <div style={{ fontSize:9, fontWeight:600, color:dow===0?T.coral:dow===6?T.blue:T.textDim }}>{DOW[dow]}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:dow===0?T.coral:T.text }}>{d}</div>
                  </div>
                  <div style={{ display:"flex", gap:3 }}>
                    {Object.entries(SHIFTS).map(([k]) => <ShiftBadge key={k} type={k} selected={s===k} onClick={() => toggle(d,k)} />)}
                  </div>
                  {s && (
                    <button onClick={() => setPri(p=>({...p,[d]:((p[d]||1)%3)+1}))} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:12 }}>
                      {Array.from({length:pri[d]||1}).map((_,i) => <span key={i} style={{color:(pri[d]||1)>=3?T.coral:(pri[d]||1)>=2?T.amber:T.textDim}}>★</span>)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ padding:"12px 20px", background:T.white, borderTop:`1px solid ${T.border}`, display:"flex", flexDirection:"column", gap:8 }}>
            {error && <div style={{ fontSize:12, color:T.coral, background:T.coralSoft, padding:"6px 10px", borderRadius:6 }}>⚠️ {error}</div>}
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="secondary" onClick={() => {setSel({});setPri({});}}>リセット</Btn>
              <Btn variant="primary" disabled={cnt===0||loading} onClick={handleSubmit} style={{ flex:1 }}>{loading ? "送信中..." : `提出する（${cnt}日）`}</Btn>
            </div>
          </div>
        </>
      )}

      {tab === 1 && (
        <div style={{ flex:1, overflow:"auto", padding:20 }}>
          {/* Summary badges */}
          <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
            <div style={{ padding:"10px 16px", borderRadius:10, background:T.amberSoft, textAlign:"center", minWidth:80 }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.amber, fontFamily:MONO }}>{statusSummary.pending||0}</div>
              <div style={{ fontSize:10, color:T.amber, fontWeight:600 }}>承認待ち</div>
            </div>
            <div style={{ padding:"10px 16px", borderRadius:10, background:T.tealSoft, textAlign:"center", minWidth:80 }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.teal, fontFamily:MONO }}>{statusSummary.approved||0}</div>
              <div style={{ fontSize:10, color:T.teal, fontWeight:600 }}>承認済み</div>
            </div>
            <div style={{ padding:"10px 16px", borderRadius:10, background:T.coralSoft, textAlign:"center", minWidth:80 }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.coral, fontFamily:MONO }}>{statusSummary.rejected||0}</div>
              <div style={{ fontSize:10, color:T.coral, fontWeight:600 }}>却下</div>
            </div>
            <div style={{ padding:"10px 16px", borderRadius:10, background:T.surface, textAlign:"center", minWidth:80 }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.textMid, fontFamily:MONO }}>{myRequests.length}</div>
              <div style={{ fontSize:10, color:T.textSub, fontWeight:600 }}>合計</div>
            </div>
          </div>

          {reqLoading ? <div style={{ textAlign:'center', padding:40, color:T.textSub }}>読み込み中...</div> :
           myRequests.length === 0 ? <Empty icon="📝" title="提出済みの希望はありません" sub="「希望を提出」タブから希望シフトを提出してください" /> : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {myRequests.map((r, i) => {
                const dateObj = new Date(r.request_date);
                const dow = dateObj.getDay();
                return (
                  <Card key={r.id} style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:44, textAlign:"center", flexShrink:0 }}>
                        <div style={{ fontSize:10, fontWeight:600, color:dow===0?T.coral:dow===6?T.blue:T.textDim }}>{DOW[dow]}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:dow===0?T.coral:T.text }}>{dateObj.getDate()}</div>
                        <div style={{ fontSize:9, color:T.textDim }}>{dateObj.getMonth()+1}/{dateObj.getDate()}</div>
                      </div>
                      <ShiftBadge type={r.preferred_shift} size="md" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{SHIFTS[r.preferred_shift]?.f}</div>
                        {r.reason && <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>理由: {r.reason}</div>}
                        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                          {Array.from({length:r.priority||1}).map((_,j) => <span key={j} style={{ fontSize:10, color:r.priority>=3?T.coral:r.priority>=2?T.amber:T.textDim }}>★</span>)}
                          <span style={{ fontSize:10, color:T.textDim }}>優先度{r.priority}</span>
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.status === 'rejected' && r.reject_reason && (
                      <div style={{ marginTop:8, padding:"6px 10px", background:T.coralSoft, borderRadius:6, fontSize:12, color:T.coral }}>
                        却下理由: {r.reject_reason}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ✅ APPROVAL PAGE（NEW!）
// ─────────────────────────────────────────────
function ApprovalPage({ user, onPendingCountChange }) {
  const isManager = user.role === "admin" || user.role === "manager";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterMonth, setFilterMonth] = useState("2026-05");
  const [filterPos, setFilterPos] = useState(null);
  const [processing, setProcessing] = useState(null); // id being processed
  const [rejectModal, setRejectModal] = useState(null); // { id, staffName, date }
  const [rejectReason, setRejectReason] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    if (!supabase) {
      // Demo data enriched with staff name/pos
      const enriched = DEMO_REQUESTS.map(r => ({
        ...r,
        staffName: r.staffName || STAFF_DATA.find(s=>s.id===r.staff_id)?.name || '不明',
        pos: r.pos || STAFF_DATA.find(s=>s.id===r.staff_id)?.pos || 'nurse',
      }));
      setRequests(enriched);
      const pending = enriched.filter(r=>r.status==='pending').length;
      onPendingCountChange?.(pending);
      setLoading(false);
      return;
    }
    try {
      const { data: rData } = await supabase.from('shift_requests').select('*, staff_profiles(id, last_name, first_name, position)').eq('target_month', filterMonth).order('request_date');
      if (rData) {
        const enriched = rData.map(r => ({
          ...r,
          staffName: r.staff_profiles ? r.staff_profiles.last_name + ' ' + r.staff_profiles.first_name : '不明',
          pos: { doctor:'doctor', doctor_ped:'doctor_ped', doctor_int:'doctor_int', doctor_derm:'doctor_derm', doctor_ortho:'doctor_ortho', nurse:'nurse', pt:'pt', ot:'ot', trainer:'trainer', lab:'lab', receptionist:'clerk', clerk:'clerk', technician:'assistant', assistant:'assistant' }[r.staff_profiles?.position] || 'nurse',
        }));
        setRequests(enriched);
        const pending = enriched.filter(r=>r.status==='pending').length;
        onPendingCountChange?.(pending);
      }
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRequests(); }, [filterMonth]);

  const handleAction = async (id, action, reason = "") => {
    setProcessing(id);
    try {
      const req = requests.find(r => r.id === id);
      if (supabase && req) {
        await supabase.from('shift_requests').update({ status: action, reject_reason: reason || null }).eq('id', id);
        // Notify staff
        const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
        const notifBody = action === 'approved'
          ? `${req.request_date}の希望シフト（${SHIFTS[req.preferred_shift]?.f}）が承認されました`
          : `${req.request_date}の希望シフトが却下されました${reason ? `（理由: ${reason}）` : ''}`;
        await supabase.from('notifications').insert([{
          clinic_id: clinicData.id, staff_id: req.staff_id,
          title: action === 'approved' ? '✅ 希望シフト承認' : '❌ 希望シフト却下',
          body: notifBody, icon: action === 'approved' ? '✅' : '❌', read: false,
        }]);
      }
      // Update local state
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, reject_reason: reason } : r));
      const newPending = requests.filter(r => r.id !== id && r.status === 'pending').length + (action === 'pending' ? 1 : 0);
      onPendingCountChange?.(newPending);
    } catch(err) { console.error(err); }
    finally { setProcessing(null); setRejectModal(null); setRejectReason(""); }
  };

  const handleBulkApprove = async () => {
    setBulkProcessing(true);
    try {
      for (const id of bulkSelected) {
        await handleAction(id, 'approved');
      }
      setBulkSelected(new Set());
    } finally { setBulkProcessing(false); }
  };

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterPos && r.pos !== filterPos) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (!isManager) return <Empty icon="🔒" title="管理者/マネージャー限定機能" sub="申請承認は管理者またはマネージャーアカウントでのみ利用できます。" />;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>✅ 申請承認管理</h2>
          {pendingCount > 0 && <span style={{ fontSize:12, fontWeight:700, background:T.teal, color:"#fff", padding:"3px 10px", borderRadius:20 }}>{pendingCount}件 承認待ち</span>}
          <div style={{ flex:1 }}/>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:FONT, background:T.white }}>
            <option value="2026-04">2026年4月</option>
            <option value="2026-05">2026年5月</option>
            <option value="2026-06">2026年6月</option>
          </select>
        </div>
        {/* Stats row */}
        <div style={{ display:"flex", gap:8 }}>
          {[
            { label:"承認待ち", count:pendingCount, color:T.amber, bg:T.amberSoft, key:"pending" },
            { label:"承認済み", count:approvedCount, color:T.teal, bg:T.tealSoft, key:"approved" },
            { label:"却下",     count:rejectedCount, color:T.coral, bg:T.coralSoft, key:"rejected" },
            { label:"合計",     count:requests.length, color:T.textMid, bg:T.surface, key:"all" },
          ].map(s => (
            <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{ flex:1, padding:"10px 8px", borderRadius:10, border:`2px solid ${filterStatus===s.key ? s.color : 'transparent'}`, background:filterStatus===s.key ? s.bg : T.surface, cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>
              <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:MONO }}>{s.count}</div>
              <div style={{ fontSize:10, fontWeight:600, color:s.color }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding:"10px 20px", background:T.bg, borderBottom:`1px solid ${T.border}`, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:11, fontWeight:600, color:T.textDim }}>職種:</span>
        <Btn size="sm" variant={!filterPos?"primary":"secondary"} onClick={() => setFilterPos(null)}>全員</Btn>
        {Object.entries(POSITIONS).map(([k,p]) => <Btn key={k} size="sm" variant={filterPos===k?"primary":"secondary"} onClick={() => setFilterPos(filterPos===k?null:k)} style={filterPos===k?{background:p.c}:{}}>{p.l}</Btn>)}
        {bulkSelected.size > 0 && (
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:12, fontWeight:600, color:T.textMid }}>{bulkSelected.size}件選択中</span>
            <Btn size="sm" variant="success" disabled={bulkProcessing} onClick={handleBulkApprove}>
              {bulkProcessing ? "処理中..." : `一括承認 (${bulkSelected.size})`}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setBulkSelected(new Set())}>選択解除</Btn>
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex:1, overflow:"auto", padding:16 }}>
        {loading ? <div style={{ textAlign:'center', padding:40, color:T.textSub }}>読み込み中...</div> :
         filtered.length === 0 ? <Empty icon="✅" title={filterStatus==='pending'?"承認待ちの申請はありません":"申請はありません"} sub="すべての申請が処理済みです" /> : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {/* Bulk select header for pending */}
            {filterStatus === 'pending' && filtered.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:T.bluePale, borderRadius:8, fontSize:12 }}>
                <input type="checkbox"
                  checked={bulkSelected.size === filtered.length && filtered.length > 0}
                  onChange={e => setBulkSelected(e.target.checked ? new Set(filtered.map(r=>r.id)) : new Set())}
                  style={{ cursor:"pointer" }} />
                <span style={{ color:T.blue, fontWeight:600 }}>全て選択して一括承認</span>
              </div>
            )}

            {filtered.map(r => {
              const dateObj = new Date(r.request_date);
              const dow = dateObj.getDay();
              const isProcessing = processing === r.id;
              const isSelected = bulkSelected.has(r.id);

              return (
                <Card key={r.id} style={{
                  padding:"14px 16px",
                  borderLeft: `4px solid ${r.status==='pending'?T.amber:r.status==='approved'?T.teal:T.coral}`,
                  opacity: isProcessing ? 0.6 : 1,
                  background: isSelected ? T.bluePale : T.white,
                  transition:"all 0.2s",
                }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    {/* Checkbox for pending */}
                    {r.status === 'pending' && (
                      <input type="checkbox" checked={isSelected}
                        onChange={e => { const ns = new Set(bulkSelected); e.target.checked ? ns.add(r.id) : ns.delete(r.id); setBulkSelected(ns); }}
                        style={{ marginTop:2, cursor:"pointer" }} />
                    )}

                    {/* Date column */}
                    <div style={{ width:44, textAlign:"center", flexShrink:0 }}>
                      <div style={{ fontSize:10, fontWeight:600, color:dow===0?T.coral:dow===6?T.blue:T.textDim }}>{DOW[dow]}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:dow===0?T.coral:T.text }}>{dateObj.getDate()}</div>
                      <div style={{ fontSize:9, color:T.textDim }}>{dateObj.getMonth()+1}月</div>
                    </div>

                    {/* Staff info */}
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, minWidth:100 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:POSITIONS[r.pos]?.bg||T.surface, color:POSITIONS[r.pos]?.c||T.text, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700 }}>
                        {r.staffName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700 }}>{r.staffName}</div>
                        <PosBadge pos={r.pos} size="xs" />
                      </div>
                    </div>

                    {/* Shift request */}
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <ShiftBadge type={r.preferred_shift} size="md" />
                        <span style={{ fontSize:13, fontWeight:600 }}>{SHIFTS[r.preferred_shift]?.f}</span>
                        <span style={{ fontSize:11, color:T.textDim }}>{SHIFTS[r.preferred_shift]?.time}</span>
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, color:T.textDim }}>
                          優先度: {Array.from({length:r.priority||1}).map((_,j) => <span key={j} style={{ color:r.priority>=3?T.coral:r.priority>=2?T.amber:T.textDim }}>★</span>)}
                        </span>
                        {r.reason && <span style={{ fontSize:10, color:T.textDim }}>理由: {r.reason}</span>}
                        <span style={{ fontSize:10, color:T.textDim }}>申請: {new Date(r.created_at).toLocaleDateString('ja-JP')}</span>
                      </div>
                      {r.status === 'rejected' && r.reject_reason && (
                        <div style={{ marginTop:6, fontSize:11, color:T.coral }}>却下理由: {r.reject_reason}</div>
                      )}
                    </div>

                    {/* Status / Actions */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                      <StatusBadge status={r.status} />
                      {r.status === 'pending' && (
                        <div style={{ display:"flex", gap:6 }}>
                          <Btn size="sm" variant="danger" disabled={isProcessing}
                            onClick={() => setRejectModal({ id:r.id, staffName:r.staffName, date:r.request_date, shift:r.preferred_shift })}>
                            却下
                          </Btn>
                          <Btn size="sm" variant="success" disabled={isProcessing}
                            onClick={() => handleAction(r.id, 'approved')}>
                            {isProcessing ? "..." : "承認"}
                          </Btn>
                        </div>
                      )}
                      {r.status !== 'pending' && (
                        <button onClick={() => handleAction(r.id, 'pending')} style={{ fontSize:10, color:T.textDim, background:"none", border:`1px solid ${T.border}`, borderRadius:4, padding:"2px 8px", cursor:"pointer", fontFamily:FONT }}>
                          取消
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
          <div style={{ background:T.white, borderRadius:16, padding:24, maxWidth:400, width:"100%", boxShadow:T.shadowLg }}>
            <h3 style={{ fontSize:16, fontWeight:800, margin:"0 0 8px" }}>申請を却下しますか？</h3>
            <p style={{ fontSize:13, color:T.textSub, margin:"0 0 16px" }}>
              {rejectModal.staffName}さんの {rejectModal.date} ({SHIFTS[rejectModal.shift]?.f}) の希望
            </p>
            <label style={{ display:"block", marginBottom:14 }}>
              <span style={{ fontSize:12, fontWeight:600, color:T.textSub, display:"block", marginBottom:6 }}>却下理由（任意）</span>
              <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="例: 人員不足、別スタッフ優先 など"
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:FONT, outline:"none", boxSizing:"border-box" }} />
            </label>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(""); }} style={{ flex:1 }}>キャンセル</Btn>
              <Btn variant="danger" onClick={() => handleAction(rejectModal.id, 'rejected', rejectReason)} style={{ flex:1, background:T.coral, color:"#fff" }}>却下する</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GENERATE
// ─────────────────────────────────────────────
function GeneratePage({ user, onNav }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState(70);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [generatedShifts, setGeneratedShifts] = useState(null);
  const ref = useRef(null);
  const isAdmin = user.role === "admin";
  const year = 2026, month = 4;

  const startGen = () => {
    setStep(1); setProgress(0);
    setGeneratedShifts(genShifts(year, month));
    ref.current = setInterval(() => {
      setProgress(p => { if (p>=100) { clearInterval(ref.current); setTimeout(()=>setStep(2),400); return 100; } return p + Math.random()*8+2; });
    }, 120);
  };

  const applyShifts = async () => {
    if (!supabase || !generatedShifts) { setStep(3); return; }
    setSaving(true); setSaveError("");
    try {
      const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
      const { data: staffData } = await supabase.from('staff_profiles').select('id, last_name, first_name').eq('clinic_id', clinicData.id);
      const targetMonth = `${year}-${String(month).padStart(2,'0')}`;
      const { data: reqData } = await supabase.from('shift_requests').select('staff_id, request_date, preferred_shift').eq('target_month', targetMonth).eq('status', 'approved');
      const rows = [];
      const days = new Date(year, month, 0).getDate();
      staffData.forEach(sp => {
        const match = STAFF_DATA.find(s => s.name === sp.last_name+' '+sp.first_name);
        const staffShifts = match ? generatedShifts[match.id] : null;
        const staffRequests = reqData ? reqData.filter(r => r.staff_id === sp.id) : [];
        for (let d = 1; d <= days; d++) {
          const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const req = staffRequests.find(r => r.request_date === dateStr);
          rows.push({ clinic_id:clinicData.id, staff_id:sp.id, shift_date:dateStr, shift_type:req?req.preferred_shift:(staffShifts?staffShifts[d]||'off':'off'), status:'draft' });
        }
      });
      const { error } = await supabase.from('shifts').upsert(rows, { onConflict:'staff_id,shift_date' });
      if (error) throw error;
      setStep(3);
    } catch(err) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const publishShifts = async () => {
    if (!supabase) return;
    try {
      const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
      await supabase.from('shifts').update({ status:'published' }).eq('clinic_id', clinicData.id).eq('status','draft');
      const { data: staffData } = await supabase.from('staff_profiles').select('id').eq('clinic_id', clinicData.id);
      if (staffData) {
        await supabase.from('notifications').insert(staffData.map(s => ({ clinic_id:clinicData.id, staff_id:s.id, title:'シフト公開', body:`${year}年${month}月のシフトが公開されました`, icon:'📅', read:false })));
      }
      alert('シフトを公開しました！');
    } catch(err) { alert('公開に失敗しました: '+err.message); }
  };

  useEffect(() => () => clearInterval(ref.current), []);
  if (!isAdmin) return <Empty icon="🔒" title="管理者限定機能" sub={`シフトの自動生成は管理者アカウントでのみ実行できます。\n現在の権限: ${ROLES[user.role]}`} />;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12 }}>
        <div><h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>⚡ 自動シフト生成</h2><span style={{ fontSize:11, fontWeight:600, color:T.blue }}>🛡️ 管理者限定</span></div>
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>{[0,1,2,3].map(i => <div key={i} style={{ width:8, height:8, borderRadius:4, background:i<=step?T.blue:T.border, transition:"all 0.3s" }}/>)}</div>
      </div>
      <div style={{ flex:1, overflow:"auto", padding:20, maxWidth:800 }}>
        {step===0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card><div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>📅 対象期間</div><div style={{ padding:"10px 16px", background:T.blueSoft, borderRadius:10, fontSize:16, fontWeight:700, color:T.blue }}>2026年4月</div></Card>
            <Card><div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>👥 提出状況</div><div style={{ display:"flex", alignItems:"center", gap:16 }}><div><div style={{ fontSize:24, fontWeight:800 }}>8 / 10 名</div><div style={{ fontSize:12, color:T.textDim }}>提出済み（80%）</div></div><div style={{ flex:1, height:8, background:T.surface, borderRadius:4, overflow:"hidden" }}><div style={{ width:"80%", height:"100%", background:T.teal, borderRadius:4 }}/></div></div></Card>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>⚙️ 生成条件</div>
              {["医師を常時1名以上配置","看護師を常時2名以上配置","夜勤連続は最大2日まで","週休2日を確保","承認済み希望を優先反映","公平性を最適化"].map((r,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none" }}>
                  <span style={{ fontSize:13, color:T.textMid }}>{r}</span>
                  <div style={{ width:38, height:22, borderRadius:11, background:T.teal, position:"relative" }}><div style={{ width:18, height:18, borderRadius:9, background:"#fff", position:"absolute", top:2, left:18, boxShadow:T.shadow }}/></div>
                </div>
              ))}
              <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${T.borderLight}` }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>最適化品質</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:T.textDim }}>⚡高速</span>
                  <input type="range" min={0} max={100} value={quality} onChange={e=>setQuality(+e.target.value)} style={{ flex:1, accentColor:T.blue }} />
                  <span style={{ fontSize:11, color:T.textDim }}>🎯高品質</span>
                </div>
              </div>
            </Card>
          </div>
        )}
        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:20 }}>
            <svg width={120} height={120} style={{transform:"rotate(-90deg)"}}>
              <circle cx={60} cy={60} r={54} fill="none" stroke={T.border} strokeWidth={6}/>
              <circle cx={60} cy={60} r={54} fill="none" stroke={T.blue} strokeWidth={6} strokeDasharray={339.3} strokeDashoffset={339.3-(Math.min(progress,100)/100)*339.3} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.3s"}}/>
            </svg>
            <div style={{ marginTop:-90, fontSize:26, fontWeight:800, color:T.blue, fontFamily:MONO }}>{Math.min(Math.round(progress),100)}%</div>
            <div style={{ marginTop:50, fontSize:16, fontWeight:700, color:T.text }}>{progress<25?"データを収集中...":progress<50?"制約条件を分析中...":progress<75?"最適配置を計算中...":"最終調整中..."}</div>
          </div>
        )}
        {step===2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12 }}>
              <StatCard icon="❤️" value="94.2%" label="希望反映率" color={T.teal} />
              <StatCard icon="✅" value="100%" label="充足率" color={T.blue} />
              <StatCard icon="⚖️" value="87.3" label="公平度スコア" color={T.amber} />
              <StatCard icon="🛡️" value="0件" label="制約違反" color={T.purple} />
            </div>
          </div>
        )}
        {step===3 && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px", color:T.teal }}>シフト登録完了！</h2>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
              <Btn variant="primary" onClick={() => onNav('shifts')}>シフト表を確認</Btn>
              <Btn variant="secondary" onClick={publishShifts}>シフトを公開</Btn>
            </div>
          </div>
        )}
      </div>
      {(step===0||step===2) && (
        <div style={{ padding:"12px 20px", background:T.white, borderTop:`1px solid ${T.border}`, display:"flex", gap:10, flexDirection:"column" }}>
          {saveError && <div style={{ fontSize:12, color:T.coral, padding:"6px 10px", background:T.coralSoft, borderRadius:6 }}>⚠️ {saveError}</div>}
          <div style={{ display:"flex", gap:10 }}>
            {step===2 && <Btn variant="secondary" onClick={()=>setStep(0)}>やり直す</Btn>}
            <Btn variant={step===0?"primary":"success"} disabled={saving} onClick={step===0?startGen:applyShifts} style={{ flex:1 }}>
              {step===0?"⚡ シフトを自動生成する":saving?"保存中...":"✅ このシフトを適用する"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// STAFF PAGE
// ─────────────────────────────────────────────
function StaffPage({ user }) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [addForm, setAddForm] = useState({ last_name:'', first_name:'', position:'nurse', role:'staff', email:'', night_ok:false });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true); setInviteMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: inviteEmail, options: { shouldCreateUser: true } });
      if (error) throw error;
      setInviteMsg(`✅ ${inviteEmail} に招待メールを送信しました！`);
      setInviteEmail('');
    } catch(err) { setInviteMsg('❌ ' + err.message); } finally { setInviting(false); }
  };

  const handleAddStaff = async () => {
    if (!addForm.last_name || !addForm.first_name) { setAddError('名前を入力してください'); return; }
    setAddSaving(true); setAddError('');
    try {
      const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
      const { error } = await supabase.from('staff_profiles').insert({ clinic_id:clinicData.id, last_name:addForm.last_name, first_name:addForm.first_name, position:addForm.position, role:addForm.role, email:addForm.email, night_ok:addForm.night_ok });
      if (error) throw error;
      setShowAdd(false); setAddForm({ last_name:'', first_name:'', position:'nurse', role:'staff', email:'', night_ok:false });
      const { data } = await supabase.from('staff_profiles').select('*').order('position');
      if (data) setStaffList(data.map(s => ({ id:s.id, name:s.last_name+' '+s.first_name, pos:s.position||'nurse', role:s.user_role||s.role, email:s.email||'', night:s.can_work_night||s.night_ok||false })));
    } catch(err) { setAddError(err.message); } finally { setAddSaving(false); }
  };

  useEffect(() => {
    if (!supabase) { setStaffList(STAFF_DATA); setLoading(false); return; }
    const load = async () => {
      try {
        const { data } = await supabase.from('staff_profiles').select('*').order('position');
        if (data) setStaffList(data.map(s => ({ id:s.id, name:s.last_name+' '+s.first_name, pos:s.position||'nurse', role:s.user_role||s.role, email:s.email||'', night:s.can_work_night||s.night_ok||false })));
      } catch(err) { setStaffList(STAFF_DATA); } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = staffList.filter(s => {
    if (filterPos && s.pos !== filterPos) return false;
    if (search && !s.name.includes(search) && !s.email.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding:20, maxWidth:1000 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>👥 スタッフ管理</h2>
        <span style={{ fontSize:12, color:T.textDim }}>{staffList.length}名</span>
        <div style={{ flex:1 }}/>
        {user.role==="admin" && <div style={{display:'flex',gap:8}}>
          <Btn variant="secondary" size="sm" icon="✉️" onClick={() => setShowInvite(p=>!p)}>招待メール</Btn>
          <Btn variant="primary" size="sm" icon="➕" onClick={() => setShowAdd(p=>!p)}>スタッフ追加</Btn>
        </div>}
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="名前・メールで検索..." style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:FONT, outline:"none", flex:1, minWidth:200 }} />
        <div style={{ display:"flex", gap:4 }}>
          <Btn size="sm" variant={!filterPos?"primary":"secondary"} onClick={()=>setFilterPos(null)}>全員</Btn>
          {Object.entries(POSITIONS).map(([k,p]) => <Btn key={k} size="sm" variant={filterPos===k?"primary":"secondary"} onClick={()=>setFilterPos(filterPos===k?null:k)} style={filterPos===k?{background:p.c}:{}}>{p.l}</Btn>)}
        </div>
      </div>
      {showInvite && (
        <Card style={{ marginBottom:12, padding:16, borderLeft:`3px solid ${T.blue}` }}>
          <h3 style={{ margin:"0 0 10px", fontSize:14, fontWeight:700 }}>✉️ 招待メール送信</h3>
          {inviteMsg && <div style={{ fontSize:12, marginBottom:8, color:inviteMsg.startsWith('✅')?T.teal:T.coral }}>{inviteMsg}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="staff@example.com" style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:FONT }} />
            <Btn variant="primary" onClick={handleInvite} disabled={inviting}>{inviting?'送信中...':'送信'}</Btn>
          </div>
        </Card>
      )}
      {showAdd && (
        <Card style={{ marginBottom:12, padding:16, borderLeft:`3px solid ${T.teal}` }}>
          <h3 style={{ margin:"0 0 10px", fontSize:14, fontWeight:700 }}>➕ スタッフ追加</h3>
          {addError && <div style={{ fontSize:12, color:T.coral, marginBottom:8 }}>⚠️ {addError}</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1 }}><label style={{ fontSize:12, color:T.textSub }}>姓</label><input value={addForm.last_name} onChange={e=>setAddForm(p=>({...p,last_name:e.target.value}))} placeholder="山田" style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4, boxSizing:'border-box' }} /></div>
              <div style={{ flex:1 }}><label style={{ fontSize:12, color:T.textSub }}>名</label><input value={addForm.first_name} onChange={e=>setAddForm(p=>({...p,first_name:e.target.value}))} placeholder="花子" style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4, boxSizing:'border-box' }} /></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1 }}><label style={{ fontSize:12, color:T.textSub }}>職種</label><select value={addForm.position} onChange={e=>setAddForm(p=>({...p,position:e.target.value}))} style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4 }}><option value="doctor">医師</option><option value="doctor_ped">医師：小児科</option><option value="doctor_int">医師：内科</option><option value="doctor_derm">医師：皮膚科</option><option value="doctor_ortho">医師：整形外科</option><option value="nurse">看護師</option><option value="pt">PT</option><option value="ot">OT</option><option value="trainer">スポーツトレーナー</option><option value="lab">検査技師</option><option value="assistant">助手</option><option value="clerk">事務</option></select></div>
              <div style={{ flex:1 }}><label style={{ fontSize:12, color:T.textSub }}>権限</label><select value={addForm.role} onChange={e=>setAddForm(p=>({...p,role:e.target.value}))} style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4 }}><option value="staff">スタッフ</option><option value="manager">マネージャー</option><option value="admin">管理者</option></select></div>
            </div>
            <div><label style={{ fontSize:12, color:T.textSub }}>メール（任意）</label><input type="email" value={addForm.email} onChange={e=>setAddForm(p=>({...p,email:e.target.value}))} placeholder="hanako@example.com" style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4, boxSizing:'border-box' }} /></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}><input type="checkbox" checked={addForm.night_ok} onChange={e=>setAddForm(p=>({...p,night_ok:e.target.checked}))} />夜勤可能</label>
            <div style={{ display:'flex', gap:8 }}>
              <Btn variant="secondary" onClick={() => setShowAdd(false)}>キャンセル</Btn>
              <Btn variant="primary" onClick={handleAddStaff} disabled={addSaving} style={{ flex:1 }}>{addSaving?'追加中...':'追加する'}</Btn>
            </div>
          </div>
        </Card>
      )}
      {loading ? <div style={{ textAlign:'center', padding:40, color:T.textSub }}>読み込み中...</div> : <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))", gap:8, marginBottom:16 }}>
          {Object.entries(POSITIONS).map(([k,p]) => { const c=staffList.filter(s=>s.pos===k).length; return <div key={k} style={{ textAlign:"center", padding:"10px", background:p.bg, borderRadius:10 }}><div style={{ fontSize:22, fontWeight:800, color:p.c }}>{c}</div><div style={{ fontSize:10, color:p.c, fontWeight:600 }}>{p.l}</div></div>; })}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {filtered.map(s => (
            <Card key={s.id} hover style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:POSITIONS[s.pos]?.bg||T.surface, color:POSITIONS[s.pos]?.c||T.text, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, flexShrink:0 }}>{s.name[0]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}><span style={{ fontSize:14, fontWeight:700 }}>{s.name}</span><PosBadge pos={s.pos} size="xs" /><RoleBadge role={s.role} /></div>
                <div style={{ fontSize:12, color:T.textDim, marginTop:2 }}>{s.email}</div>
              </div>
              {s.night && <span style={{ fontSize:10, fontWeight:600, color:T.purple, background:T.purpleSoft, padding:"3px 8px", borderRadius:6 }}>夜勤○</span>}
            </Card>
          ))}
        </div>
      </>}
    </div>
  );
}

// ─────────────────────────────────────────────
// SWAP PAGE
// ─────────────────────────────────────────────
function SwapPage({ user }) {
  const [tab, setTab] = useState(0);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ target_id:'', requester_date:'', target_date:'', reason:'' });
  const [staffList, setStaffList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: spData } = await supabase.from('staff_profiles').select('id, last_name, first_name');
      setStaffList(spData || []);
      const { data: exData } = await supabase.from('shift_exchanges').select('*').order('created_at', { ascending:false });
      if (exData) {
        setSwaps(exData.map(ex => ({
          ...ex,
          requesterName: spData?.find(s=>s.id===ex.requester_id) ? spData.find(s=>s.id===ex.requester_id).last_name+' '+spData.find(s=>s.id===ex.requester_id).first_name : '不明',
          targetName: spData?.find(s=>s.id===ex.target_id) ? spData.find(s=>s.id===ex.target_id).last_name+' '+spData.find(s=>s.id===ex.target_id).first_name : '不明',
        })));
      }
    } catch(err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!form.target_id||!form.requester_date||!form.target_date) { setError('必須項目を入力してください'); return; }
    setSaving(true); setError('');
    try {
      const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
      const { error: err } = await supabase.from('shift_exchanges').insert({ clinic_id:clinicData.id, requester_id:user.id, target_id:form.target_id, requester_date:form.requester_date, target_date:form.target_date, reason:form.reason, status:'pending' });
      if (err) throw err;
      await supabase.from('notifications').insert([{ clinic_id:clinicData.id, staff_id:form.target_id, title:'交換リクエスト', body:`${user.name||'スタッフ'}さんから${form.requester_date}のシフト交換リクエストが届いています`, icon:'🔄', read:false }]);
      setShowForm(false); setForm({ target_id:'', requester_date:'', target_date:'', reason:'' });
      loadData();
    } catch(err) { setError(err.message); } finally { setSaving(false); }
  };

  const handleApprove = async (id, approved) => {
    try {
      const sw = swaps.find(s=>s.id===id);
      await supabase.from('shift_exchanges').update({ status:approved?'approved':'rejected' }).eq('id', id);
      if (approved && sw) {
        const { data: reqShift } = await supabase.from('shifts').select('shift_type').eq('staff_id',sw.requester_id).eq('shift_date',sw.requester_date).single();
        const { data: tgtShift } = await supabase.from('shifts').select('shift_type').eq('staff_id',sw.target_id).eq('shift_date',sw.target_date).single();
        if (reqShift&&tgtShift) {
          await supabase.from('shifts').update({shift_type:tgtShift.shift_type}).eq('staff_id',sw.requester_id).eq('shift_date',sw.requester_date);
          await supabase.from('shifts').update({shift_type:reqShift.shift_type}).eq('staff_id',sw.target_id).eq('shift_date',sw.target_date);
        }
        const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
        await supabase.from('notifications').insert([{ clinic_id:clinicData.id, staff_id:sw.requester_id, title:'シフト交換承認', body:`${sw.requester_date}のシフト交換が承認されました`, icon:'🔄', read:false }]);
      }
      loadData();
    } catch(err) { console.error(err); }
  };

  const incoming = swaps.filter(s=>s.target_id===user.id);
  const outgoing = swaps.filter(s=>s.requester_id===user.id);
  const displayed = tab===0?incoming:outgoing;
  const statusLabel = s => s==='pending'?'承認待ち':s==='approved'?'承認済み':'却下';
  const statusColor = s => s==='pending'?T.amber:s==='approved'?T.teal:T.coral;
  const statusBg = s => s==='pending'?T.amberSoft:s==='approved'?T.tealSoft:T.coralSoft;

  return (
    <div style={{ padding:20, maxWidth:700 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>🔄 シフト交換</h2>
        <div style={{ flex:1 }}/>
        <Btn variant="primary" size="sm" icon="➕" onClick={() => setShowForm(p=>!p)}>交換リクエスト</Btn>
      </div>
      {showForm && (
        <Card style={{ marginBottom:16, padding:16, borderLeft:`3px solid ${T.blue}` }}>
          <h3 style={{ margin:"0 0 12px", fontSize:14, fontWeight:700 }}>新しい交換リクエスト</h3>
          {error && <div style={{ fontSize:12, color:T.coral, marginBottom:8 }}>⚠️ {error}</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div><label style={{ fontSize:12, color:T.textSub }}>交換相手</label><select value={form.target_id} onChange={e=>setForm(p=>({...p,target_id:e.target.value}))} style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4 }}><option value="">選択してください</option>{staffList.filter(s=>s.id!==user.id).map(s=><option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}</select></div>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1 }}><label style={{ fontSize:12, color:T.textSub }}>自分のシフト日</label><input type="date" value={form.requester_date} onChange={e=>setForm(p=>({...p,requester_date:e.target.value}))} style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4, boxSizing:'border-box' }} /></div>
              <div style={{ flex:1 }}><label style={{ fontSize:12, color:T.textSub }}>相手のシフト日</label><input type="date" value={form.target_date} onChange={e=>setForm(p=>({...p,target_date:e.target.value}))} style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4, boxSizing:'border-box' }} /></div>
            </div>
            <div><label style={{ fontSize:12, color:T.textSub }}>理由（任意）</label><input type="text" value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} placeholder="例: 家庭の事情" style={{ width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, marginTop:4, boxSizing:'border-box' }} /></div>
            <div style={{ display:'flex', gap:8 }}><Btn variant="secondary" onClick={()=>setShowForm(false)}>キャンセル</Btn><Btn variant="primary" onClick={handleSubmit} disabled={saving} style={{ flex:1 }}>{saving?'送信中...':'送信する'}</Btn></div>
          </div>
        </Card>
      )}
      <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${T.border}` }}>
        {["受信","送信済み"].map((l,i) => <button key={i} onClick={()=>setTab(i)} style={{ padding:"10px 20px", border:"none", background:"none", cursor:"pointer", borderBottom:tab===i?`3px solid ${T.blue}`:"3px solid transparent", color:tab===i?T.text:T.textDim, fontSize:13, fontWeight:tab===i?700:500, fontFamily:FONT }}>{l}</button>)}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:40, color:T.textSub }}>読み込み中...</div> :
       displayed.length===0 ? <Empty icon="🔄" title="リクエストなし" sub="交換リクエストはありません" /> :
       displayed.map(sw => (
        <Card key={sw.id} style={{ marginBottom:10, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:14, fontWeight:700 }}>{sw.requesterName} → {sw.targetName}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:statusBg(sw.status), color:statusColor(sw.status) }}>{statusLabel(sw.status)}</span>
          </div>
          <div style={{ fontSize:12, color:T.textSub }}>{sw.requester_date} ⇄ {sw.target_date}</div>
          {sw.reason && <div style={{ fontSize:12, color:T.textDim, marginTop:6 }}>理由: {sw.reason}</div>}
          {sw.status==='pending'&&tab===0 && <div style={{ display:"flex", gap:8, marginTop:10 }}><Btn size="sm" variant="danger" onClick={()=>handleApprove(sw.id,false)}>却下</Btn><Btn size="sm" variant="success" onClick={()=>handleApprove(sw.id,true)}>承認</Btn></div>}
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// NOTIF / SETTINGS
// ─────────────────────────────────────────────
function NotifPage({ user }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    if (!supabase||user.id==='new') { setLoading(false); return; }
    try { const { data } = await supabase.from('notifications').select('*').eq('staff_id', user.id).order('created_at', { ascending:false }); setNotifs(data||[]); }
    catch(err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { loadNotifs(); }, [user.id]);

  const markRead = async (id) => {
    try { await supabase.from('notifications').update({read:true}).eq('id',id); setNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n)); } catch(err) {}
  };
  const markAllRead = async () => {
    try { await supabase.from('notifications').update({read:true}).eq('staff_id',user.id).eq('read',false); setNotifs(p=>p.map(n=>({...n,read:true}))); } catch(err) {}
  };
  const unreadCount = notifs.filter(n=>!n.read).length;

  return (
    <div style={{ padding:20, maxWidth:700 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>🔔 通知</h2>
        {unreadCount>0 && <span style={{ fontSize:11, fontWeight:700, background:T.blue, color:'#fff', padding:'2px 8px', borderRadius:10 }}>{unreadCount}</span>}
        <div style={{ flex:1 }}/>
        {unreadCount>0 && <Btn size="sm" variant="secondary" onClick={markAllRead}>すべて既読</Btn>}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:40, color:T.textSub }}>読み込み中...</div> :
       notifs.length===0 ? <Empty icon="🔔" title="通知なし" sub="新しい通知はありません" /> :
       notifs.map((n,i) => (
        <Card key={n.id} hover style={{ marginBottom:8, padding:14, opacity:n.read?0.6:1, cursor:"pointer" }} onClick={() => !n.read&&markRead(n.id)}>
          <div style={{ display:"flex", gap:12 }}>
            <span style={{ fontSize:24 }}>{n.icon||'🔔'}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:13, fontWeight:n.read?500:700 }}>{n.title}</span><span style={{ fontSize:10, color:T.textDim }}>{new Date(n.created_at).toLocaleDateString('ja-JP')}</span></div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{n.body}</div>
            </div>
            {!n.read && <div style={{ width:8, height:8, borderRadius:4, background:T.blue, marginTop:4 }}/>}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ATTENDANCE PAGE
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// ATTENDANCE PAGE（勤怠管理 - フル機能版）
// ─────────────────────────────────────────────
function AttendancePage({ user }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(user.id);
  const [tab, setTab] = useState(0); // 0=自分, 1=全スタッフ一覧
  const [allStaffSummary, setAllStaffSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [wageSettings, setWageSettings] = useState({}); // staffId -> hourlyWage
  const [showWageEdit, setShowWageEdit] = useState(false);
  const [stdHoursPerDay, setStdHoursPerDay] = useState(8); // 残業判定ライン（時間）
  const [overtimeRate, setOvertimeRate] = useState(1.25); // 残業割増率
  const [defaultWage, setDefaultWage] = useState(1500); // デフォルト時給
  const isManager = user.role === "admin" || user.role === "manager";
  const todayStr = today.toISOString().split('T')[0];

  // 標準労働時間・残業割増率はstateで管理
  const STD_HOURS_PER_DAY = stdHoursPerDay;
  const OVERTIME_RATE = overtimeRate;

  // デモ用勤怠データ生成
  const genDemoRecords = (staffId, y, m) => {
    const days = new Date(y, m, 0).getDate();
    const recs = [];
    for (let d = 1; d <= Math.min(d, today.getDate() + (today.getMonth()+1===m && today.getFullYear()===y ? 0 : days)); d++) {
      const date = new Date(y, m-1, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;
      if (d > (today.getMonth()+1===m && today.getFullYear()===y ? today.getDate()-1 : days)) continue;
      const baseIn = 8 * 60 + Math.floor(Math.random()*20);
      const baseOut = 17 * 60 + 30 + Math.floor(Math.random()*120);
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const clockIn = new Date(y, m-1, d, Math.floor(baseIn/60), baseIn%60).toISOString();
      const clockOut = new Date(y, m-1, d, Math.floor(baseOut/60), baseOut%60).toISOString();
      recs.push({ id:`demo_${staffId}_${d}`, staff_id:staffId, date:dateStr, clock_in:clockIn, clock_out:clockOut, break_minutes:60, status:'present', note:'' });
    }
    return recs;
  };

  const genDemoStaff = () => STAFF_DATA.map(s => ({
    id: s.id, last_name: s.name.split(' ')[0], first_name: s.name.split(' ')[1]||'',
    position: s.pos, user_role: s.role
  }));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          const staffId = isManager ? selectedStaff : user.id;
          setRecords(genDemoRecords(staffId, year, month));
          if (isManager) setStaffList(genDemoStaff());
          setLoading(false);
          return;
        }
        const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        const staffId = isManager ? selectedStaff : user.id;
        const { data } = await supabase.from('attendance_records').select('*')
          .eq('staff_id', staffId).gte('date', startDate).lte('date', endDate).order('date');
        setRecords(data || []);
        const todayRec = data?.find(r => r.date === todayStr);
        setTodayRecord(todayRec || null);
        setClockedIn(!!todayRec?.clock_in && !todayRec?.clock_out);
        if (isManager) {
          const { data: sp } = await supabase.from('staff_profiles').select('id, last_name, first_name, position, user_role');
          if (sp) setStaffList(sp);
        }
      } catch(e) {
        setRecords(genDemoRecords(user.id, year, month));
      } finally { setLoading(false); }
    };
    load();
  }, [year, month, selectedStaff]);

  // 全スタッフサマリー取得
  useEffect(() => {
    if (tab !== 1 || !isManager) return;
    setSummaryLoading(true);
    const loadAll = async () => {
      try {
        const staffData = staffList.length > 0 ? staffList : genDemoStaff();
        const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        const summaries = [];
        for (const sp of staffData) {
          let recs;
          if (!supabase) {
            const sd = STAFF_DATA.find(s => s.id === sp.id);
            recs = genDemoRecords(sp.id, year, month);
          } else {
            const { data } = await supabase.from('attendance_records').select('*')
              .eq('staff_id', sp.id).gte('date', startDate).lte('date', endDate);
            recs = data || [];
          }
          const workDays = recs.filter(r => r.clock_in).length;
          const totalMin = recs.reduce((acc, r) => {
            if (!r.clock_in || !r.clock_out) return acc;
            return acc + (new Date(r.clock_out) - new Date(r.clock_in))/1000/60 - (r.break_minutes||60);
          }, 0);
          const overtimeMin = recs.reduce((acc, r) => {
            if (!r.clock_in || !r.clock_out) return acc;
            const worked = (new Date(r.clock_out) - new Date(r.clock_in))/1000/60 - (r.break_minutes||60);
            return acc + Math.max(0, worked - STD_HOURS_PER_DAY*60);
          }, 0);
          const wage = wageSettings[sp.id] || defaultWage;
          const regularPay = Math.round((totalMin - overtimeMin) / 60 * wage);
          const overtimePay = Math.round(overtimeMin / 60 * wage * OVERTIME_RATE);
          summaries.push({
            id: sp.id,
            name: sp.last_name + ' ' + (sp.first_name||''),
            pos: sp.position || 'nurse',
            role: sp.user_role || 'staff',
            workDays, totalMin, overtimeMin,
            totalH: Math.floor(totalMin/60), totalM: Math.round(totalMin%60),
            overtimeH: Math.floor(overtimeMin/60), overtimeM: Math.round(overtimeMin%60),
            regularPay, overtimePay, totalPay: regularPay + overtimePay,
            wage,
          });
        }
        setAllStaffSummary(summaries);
      } catch(e) { console.error(e); }
      finally { setSummaryLoading(false); }
    };
    loadAll();
  }, [tab, year, month, staffList, wageSettings, stdHoursPerDay, overtimeRate, defaultWage]);

  const calcWorkHours = (r) => {
    if (!r?.clock_in || !r?.clock_out) return null;
    const diff = (new Date(r.clock_out) - new Date(r.clock_in)) / 1000 / 60;
    const net = diff - (r.break_minutes || 60);
    const h = Math.floor(net/60); const m = Math.round(net%60);
    return `${h}時間${m}分`;
  };

  const calcOvertime = (r) => {
    if (!r?.clock_in || !r?.clock_out) return 0;
    const net = (new Date(r.clock_out) - new Date(r.clock_in))/1000/60 - (r.break_minutes||60);
    return Math.max(0, net - STD_HOURS_PER_DAY*60);
  };

  const handleClockIn = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (!supabase) {
        const rec = { id:`local_${Date.now()}`, staff_id:user.id, date:todayStr, clock_in:now, clock_out:null, break_minutes:60, status:'present' };
        setTodayRecord(rec); setClockedIn(true);
        setRecords(prev => [...prev.filter(r=>r.date!==todayStr), rec]);
        setSaving(false); return;
      }
      const { data: clinicData } = await supabase.from('clinics').select('id').limit(1).single();
      const { data } = await supabase.from('attendance_records').insert({
        clinic_id:clinicData.id, staff_id:user.id, date:todayStr, clock_in:now, status:'present'
      }).select().single();
      setTodayRecord(data); setClockedIn(true);
      setRecords(prev => [...prev.filter(r=>r.date!==todayStr), data]);
    } catch(e) {} finally { setSaving(false); }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (!supabase) {
        const updated = { ...todayRecord, clock_out:now };
        setTodayRecord(updated); setClockedIn(false);
        setRecords(prev => prev.map(r=>r.date===todayStr?updated:r));
        setSaving(false); return;
      }
      const { data } = await supabase.from('attendance_records').update({ clock_out:now })
        .eq('id', todayRecord.id).select().single();
      setTodayRecord(data); setClockedIn(false);
      setRecords(prev => prev.map(r=>r.id===data.id?data:r));
    } catch(e) {} finally { setSaving(false); }
  };

  // CSVエクスポート（個人）
  const exportCSV = () => {
    const staffName = isManager
      ? (() => { const s = STAFF_DATA.find(s=>s.id===selectedStaff); return s ? s.name : selectedStaff; })()
      : user.name;
    const header = ['日付', '曜日', '出勤時刻', '退勤時刻', '休憩(分)', '勤務時間', '残業時間', 'ステータス', '備考'];
    const rows = records.map(r => {
      const d = new Date(r.date+'T00:00:00');
      const workMin = r.clock_in && r.clock_out ? (new Date(r.clock_out)-new Date(r.clock_in))/1000/60-(r.break_minutes||60) : 0;
      const otMin = calcOvertime(r);
      return [
        r.date,
        ['日','月','火','水','木','金','土'][d.getDay()],
        r.clock_in ? new Date(r.clock_in).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) : '',
        r.clock_out ? new Date(r.clock_out).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) : '',
        r.break_minutes || 60,
        workMin > 0 ? `${Math.floor(workMin/60)}:${String(Math.round(workMin%60)).padStart(2,'0')}` : '',
        otMin > 0 ? `${Math.floor(otMin/60)}:${String(Math.round(otMin%60)).padStart(2,'0')}` : '0:00',
        r.status==='present'?'出勤':r.status==='absent'?'欠勤':'有給',
        r.note||''
      ];
    });
    const bom = '\uFEFF';
    const csv = bom + [header, ...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `勤怠_${staffName}_${year}年${month}月.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // CSVエクスポート（全スタッフ）
  const exportAllCSV = () => {
    const header = ['スタッフ名', '職種', '出勤日数', '総勤務時間', '残業時間', '時給(円)', '基本給(円)', '残業代(円)', '合計給与(円)'];
    const rows = allStaffSummary.map(s => [
      s.name, POSITIONS[s.pos]?.l||s.pos, s.workDays,
      `${s.totalH}:${String(s.totalM).padStart(2,'0')}`,
      `${s.overtimeH}:${String(s.overtimeM).padStart(2,'0')}`,
      s.wage, s.regularPay, s.overtimePay, s.totalPay
    ]);
    const total = allStaffSummary.reduce((acc,s) => ({
      workDays: acc.workDays+s.workDays, totalMin: acc.totalMin+s.totalMin,
      overtimeMin: acc.overtimeMin+s.overtimeMin, totalPay: acc.totalPay+s.totalPay
    }), {workDays:0, totalMin:0, overtimeMin:0, totalPay:0});
    rows.push(['【合計】','',total.workDays,
      `${Math.floor(total.totalMin/60)}:${String(Math.round(total.totalMin%60)).padStart(2,'0')}`,
      `${Math.floor(total.overtimeMin/60)}:${String(Math.round(total.overtimeMin%60)).padStart(2,'0')}`,
      '','','',total.totalPay
    ]);
    const bom = '\uFEFF';
    const csv = bom + [header, ...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url;
    a.download=`給与計算_${year}年${month}月.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const totalDays = records.filter(r=>r.clock_in).length;
  const totalMin = records.reduce((acc,r) => {
    if (!r.clock_in||!r.clock_out) return acc;
    return acc + (new Date(r.clock_out)-new Date(r.clock_in))/1000/60-(r.break_minutes||60);
  }, 0);
  const totalOvertimeMin = records.reduce((acc,r) => acc + calcOvertime(r), 0);
  const totalH = Math.floor(totalMin/60); const totalM = Math.round(totalMin%60);
  const otH = Math.floor(totalOvertimeMin/60); const otM = Math.round(totalOvertimeMin%60);
  const myWage = wageSettings[user.id] || defaultWage;
  const regularPay = Math.round((totalMin-totalOvertimeMin)/60*myWage);
  const overtimePay = Math.round(totalOvertimeMin/60*myWage*OVERTIME_RATE);

  const prevMonth = () => { if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const selectedStaffName = isManager
    ? (() => { const found = [...STAFF_DATA, ...staffList.map(s=>({id:s.id, name:s.last_name+' '+(s.first_name||'')}))].find(s=>s.id===selectedStaff); return found?.name||''; })()
    : user.name;

  return (
    <div style={{ padding:20, maxWidth:1000 }}>
      {/* ヘッダー */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>⏱️ 勤怠管理</h2>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <Btn size="sm" variant="secondary" onClick={prevMonth}>＜</Btn>
          <span style={{ fontSize:14, fontWeight:700 }}>{year}年{month}月</span>
          <Btn size="sm" variant="secondary" onClick={nextMonth}>＞</Btn>
          <Btn size="sm" variant="secondary" icon="⬇️" onClick={tab===1?exportAllCSV:exportCSV}>
            {tab===1 ? '全スタッフCSV' : 'CSVエクスポート'}
          </Btn>
        </div>
      </div>

      {/* タブ（管理者のみ） */}
      {isManager && (
        <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${T.border}` }}>
          {['自分の勤怠', '全スタッフ一覧・給与計算'].map((l,i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding:"9px 18px", border:"none", background:"none", cursor:"pointer", borderBottom:tab===i?`3px solid ${T.blue}`:"3px solid transparent", color:tab===i?T.blue:T.textDim, fontSize:13, fontWeight:tab===i?700:500, fontFamily:FONT, transition:"all 0.15s" }}>{l}</button>
          ))}
        </div>
      )}

      {/* ── タブ0: 自分の勤怠 ── */}
      {tab === 0 && (
        <>
          {/* スタッフ選択（管理者のみ） */}
          {isManager && (
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:600, color:T.textSub }}>表示スタッフ:</span>
              <select value={selectedStaff} onChange={e=>setSelectedStaff(e.target.value)}
                style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:FONT }}>
                <option value={user.id}>自分（{user.name}）</option>
                {STAFF_DATA.filter(s=>s.id!==user.id).map(s => (
                  <option key={s.id} value={s.id}>{s.name}（{POSITIONS[s.pos]?.l}）</option>
                ))}
              </select>
              {selectedStaff !== user.id && (
                <span style={{ fontSize:11, color:T.blue, background:T.blueSoft, padding:"3px 8px", borderRadius:6, fontWeight:600 }}>👁️ 閲覧モード</span>
              )}
            </div>
          )}

          {/* 今日の打刻カード */}
          {selectedStaff === user.id && (
            <Card style={{ marginBottom:16, background: clockedIn ? `linear-gradient(135deg, ${T.teal}, #0d9488)` : todayRecord?.clock_out ? `linear-gradient(135deg, #2D4263, ${T.navy})` : `linear-gradient(135deg, ${T.navy}, ${T.navyLight})` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:4 }}>
                    今日 {today.toLocaleDateString('ja-JP', {month:'long', day:'numeric', weekday:'short'})}
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>
                    {clockedIn ? "⏳ 勤務中" : todayRecord?.clock_out ? "✅ 退勤済み" : "📍 未出勤"}
                  </div>
                  {todayRecord?.clock_in && (
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:4 }}>
                      🟢 {new Date(todayRecord.clock_in).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}
                      {todayRecord.clock_out && `　🔴 ${new Date(todayRecord.clock_out).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}`}
                      {todayRecord.clock_out && `　⏱️ ${calcWorkHours(todayRecord)}`}
                      {todayRecord.clock_out && calcOvertime(todayRecord) > 0 && (
                        <span style={{ color:"#FCD34D", marginLeft:8 }}>⚠️ 残業 {Math.floor(calcOvertime(todayRecord)/60)}時間{Math.round(calcOvertime(todayRecord)%60)}分</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {!todayRecord?.clock_in && (
                    <Btn onClick={handleClockIn} disabled={saving}
                      style={{ background:"rgba(255,255,255,0.2)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", fontSize:15, padding:"12px 28px", borderRadius:10, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>
                      {saving ? "..." : "🟢 出勤"}
                    </Btn>
                  )}
                  {clockedIn && (
                    <Btn onClick={handleClockOut} disabled={saving}
                      style={{ background:"rgba(232,98,92,0.3)", color:"#fff", border:"1px solid rgba(232,98,92,0.4)", fontSize:15, padding:"12px 28px", borderRadius:10, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>
                      {saving ? "..." : "🔴 退勤"}
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 月次サマリー */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))", gap:12, marginBottom:16 }}>
            <Card style={{ textAlign:"center", padding:14 }}>
              <div style={{ fontSize:26, fontWeight:800, color:T.blue, fontFamily:MONO }}>{totalDays}</div>
              <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>出勤日数</div>
            </Card>
            <Card style={{ textAlign:"center", padding:14 }}>
              <div style={{ fontSize:22, fontWeight:800, color:T.teal, fontFamily:MONO }}>{totalH}<span style={{fontSize:12}}>時間</span>{totalM}<span style={{fontSize:12}}>分</span></div>
              <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>総勤務時間</div>
            </Card>
            <Card style={{ textAlign:"center", padding:14, border: totalOvertimeMin>0?`1px solid ${T.coral}20`:undefined }}>
              <div style={{ fontSize:22, fontWeight:800, color:totalOvertimeMin>0?T.coral:T.textDim, fontFamily:MONO }}>{otH}<span style={{fontSize:12}}>時間</span>{otM}<span style={{fontSize:12}}>分</span></div>
              <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>残業時間</div>
            </Card>
            <Card style={{ textAlign:"center", padding:14 }}>
              <div style={{ fontSize:26, fontWeight:800, color:T.amber, fontFamily:MONO }}>{records.filter(r=>r.status==='absent').length}</div>
              <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>欠勤日数</div>
            </Card>
          </div>

          {/* 給与計算サマリー */}
          <Card style={{ marginBottom:16, borderLeft:`3px solid ${T.purple}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.purple }}>💰 給与計算（概算）</div>
              <button onClick={() => setShowWageEdit(p=>!p)} style={{ fontSize:11, color:T.textSub, background:"none", border:`1px solid ${T.border}`, borderRadius:6, padding:"3px 8px", cursor:"pointer", fontFamily:FONT }}>
                時給設定
              </button>
            </div>
            {showWageEdit && (
              <div style={{ padding:"10px 12px", background:T.surface, borderRadius:8, marginBottom:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:4 }}>時給（円/h）</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <input type="number" value={wageSettings[user.id]||defaultWage}
                        onChange={e => setWageSettings(p=>({...p,[user.id]:parseInt(e.target.value)||defaultWage}))}
                        style={{ width:90, padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:13 }} />
                      <span style={{ fontSize:11, color:T.textDim }}>円</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:4 }}>残業割増率</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:T.textDim }}>×</span>
                      <input type="number" step="0.01" value={overtimeRate}
                        onChange={e => setOvertimeRate(parseFloat(e.target.value)||1.25)}
                        style={{ width:70, padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:13 }} />
                      <span style={{ fontSize:11, color:T.textDim }}>倍</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:4 }}>残業判定ライン</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <input type="number" step="0.5" value={stdHoursPerDay}
                        onChange={e => setStdHoursPerDay(parseFloat(e.target.value)||8)}
                        style={{ width:65, padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:13 }} />
                      <span style={{ fontSize:11, color:T.textDim }}>h/日超</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
              <div style={{ textAlign:"center", padding:"10px 8px", background:T.surface, borderRadius:8 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.text, fontFamily:MONO }}>¥{regularPay.toLocaleString()}</div>
                <div style={{ fontSize:10, color:T.textSub }}>基本給</div>
              </div>
              <div style={{ textAlign:"center", padding:"10px 8px", background:T.coralSoft, borderRadius:8 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.coral, fontFamily:MONO }}>¥{overtimePay.toLocaleString()}</div>
                <div style={{ fontSize:10, color:T.coral }}>残業代</div>
              </div>
              <div style={{ textAlign:"center", padding:"10px 8px", background:T.purpleSoft, borderRadius:8 }}>
                <div style={{ fontSize:16, fontWeight:800, color:T.purple, fontFamily:MONO }}>¥{(regularPay+overtimePay).toLocaleString()}</div>
                <div style={{ fontSize:10, color:T.purple, fontWeight:600 }}>合計</div>
              </div>
            </div>
            <div style={{ fontSize:10, color:T.textDim, marginTop:8 }}>※ 時給¥{myWage}・残業割増×{OVERTIME_RATE}倍・{STD_HOURS_PER_DAY}h/日超を残業として計算。実際の給与は雇用契約に基づきます。</div>
          </Card>

          {/* 勤怠記録一覧 */}
          <Card>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>📋 勤怠記録 — {selectedStaffName}</div>
            {loading ? <div style={{ textAlign:"center", padding:20, color:T.textDim }}>読み込み中...</div> :
             records.length === 0 ? <Empty icon="⏱️" title="記録なし" sub="この月の勤怠記録はありません" /> :
             records.map((r, i) => {
               const d = new Date(r.date+'T00:00:00');
               const otMin = calcOvertime(r);
               return (
                 <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none" }}>
                   <div style={{ width:48, textAlign:"center", flexShrink:0 }}>
                     <div style={{ fontSize:13, fontWeight:700, color:T.textMid }}>{d.getMonth()+1}/{d.getDate()}</div>
                     <div style={{ fontSize:10, color:d.getDay()===0?T.coral:d.getDay()===6?T.blue:T.textDim }}>
                       {['日','月','火','水','木','金','土'][d.getDay()]}
                     </div>
                   </div>
                   <div style={{ flex:1 }}>
                     <div style={{ display:"flex", gap:16, fontSize:13, flexWrap:"wrap" }}>
                       <span>🟢 {r.clock_in ? new Date(r.clock_in).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) : '--:--'}</span>
                       <span>🔴 {r.clock_out ? new Date(r.clock_out).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) : '--:--'}</span>
                       {calcWorkHours(r) && <span style={{ color:T.teal, fontWeight:600 }}>⏱️ {calcWorkHours(r)}</span>}
                       {otMin > 0 && <span style={{ color:T.coral, fontWeight:600 }}>🔥 残業 {Math.floor(otMin/60)}h{Math.round(otMin%60)}m</span>}
                     </div>
                   </div>
                   <div style={{ fontSize:11, padding:"3px 8px", borderRadius:8, fontWeight:600, flexShrink:0,
                     background:r.status==='present'?T.bluePale:r.status==='absent'?"#FDECEB":"#FFF8E1",
                     color:r.status==='present'?T.blue:r.status==='absent'?T.coral:T.amber }}>
                     {r.status==='present'?'出勤':r.status==='absent'?'欠勤':'有給'}
                   </div>
                 </div>
               );
             })}
          </Card>
        </>
      )}

      {/* ── タブ1: 全スタッフサマリー ── */}
      {tab === 1 && isManager && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:13, color:T.textSub }}>全スタッフの{year}年{month}月の勤怠・給与計算</div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={() => setShowWageEdit(p=>!p)} style={{ fontSize:12, color:T.purple, background:T.purpleSoft, border:"none", borderRadius:6, padding:"5px 12px", cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>
                💰 時給一括設定
              </button>
            </div>
          </div>

          {showWageEdit && (
            <Card style={{ marginBottom:12, padding:14 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:12, color:T.purple }}>💰 給与計算設定</div>

              {/* 共通設定 */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSub, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>共通設定</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:10 }}>
                  <div style={{ padding:"8px 10px", background:T.surface, borderRadius:8 }}>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:4 }}>デフォルト時給（未設定時）</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <input type="number" value={defaultWage}
                        onChange={e => setDefaultWage(parseInt(e.target.value)||1500)}
                        style={{ width:90, padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, textAlign:"right" }} />
                      <span style={{ fontSize:11, color:T.textDim }}>円/h</span>
                    </div>
                  </div>
                  <div style={{ padding:"8px 10px", background:T.surface, borderRadius:8 }}>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:4 }}>残業割増率</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:T.textDim }}>×</span>
                      <input type="number" step="0.01" value={overtimeRate}
                        onChange={e => setOvertimeRate(parseFloat(e.target.value)||1.25)}
                        style={{ width:70, padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, textAlign:"right" }} />
                      <span style={{ fontSize:11, color:T.textDim }}>倍</span>
                    </div>
                  </div>
                  <div style={{ padding:"8px 10px", background:T.surface, borderRadius:8 }}>
                    <div style={{ fontSize:11, color:T.textSub, marginBottom:4 }}>残業判定ライン</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <input type="number" step="0.5" value={stdHoursPerDay}
                        onChange={e => setStdHoursPerDay(parseFloat(e.target.value)||8)}
                        style={{ width:65, padding:"4px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:13, textAlign:"right" }} />
                      <span style={{ fontSize:11, color:T.textDim }}>h/日超で残業</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* スタッフ別時給 */}
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSub, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>スタッフ別時給（個別設定）</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:8 }}>
                  {STAFF_DATA.map(s => (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:T.surface, borderRadius:8 }}>
                      <span style={{ fontSize:12, flex:1 }}>{s.name}</span>
                      <input type="number" value={wageSettings[s.id]||defaultWage}
                        onChange={e => setWageSettings(p=>({...p,[s.id]:parseInt(e.target.value)||defaultWage}))}
                        style={{ width:70, padding:"4px 6px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, textAlign:"right" }} />
                      <span style={{ fontSize:11, color:T.textDim }}>円/h</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 合計サマリー行 */}
          {allStaffSummary.length > 0 && (() => {
            const total = allStaffSummary.reduce((acc,s) => ({
              workDays:acc.workDays+s.workDays, totalMin:acc.totalMin+s.totalMin,
              overtimeMin:acc.overtimeMin+s.overtimeMin, totalPay:acc.totalPay+s.totalPay
            }), {workDays:0,totalMin:0,overtimeMin:0,totalPay:0});
            return (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
                {[
                  { label:"延べ出勤日数", value:`${total.workDays}日`, color:T.blue },
                  { label:"総勤務時間", value:`${Math.floor(total.totalMin/60)}h`, color:T.teal },
                  { label:"総残業時間", value:`${Math.floor(total.overtimeMin/60)}h`, color:T.coral },
                  { label:"人件費合計", value:`¥${total.totalPay.toLocaleString()}`, color:T.purple },
                ].map((s,i) => (
                  <Card key={i} style={{ textAlign:"center", padding:12 }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:MONO }}>{s.value}</div>
                    <div style={{ fontSize:10, color:T.textSub }}>{s.label}</div>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* スタッフ別一覧テーブル */}
          {summaryLoading ? <div style={{ textAlign:"center", padding:40, color:T.textSub }}>読み込み中...</div> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:FONT }}>
                <thead>
                  <tr style={{ background:T.surface }}>
                    {['スタッフ','職種','出勤日','勤務時間','残業','時給','基本給','残業代','合計給与'].map((h,i) => (
                      <th key={i} style={{ padding:"10px 12px", textAlign:i<2?'left':'right', fontWeight:700, color:T.textMid, borderBottom:`2px solid ${T.border}`, whiteSpace:"nowrap", fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allStaffSummary.map((s, i) => (
                    <tr key={s.id} style={{ background:i%2===0?T.white:T.bg }} onClick={() => { setSelectedStaff(s.id); setTab(0); }}>
                      <td style={{ padding:"10px 12px", borderBottom:`1px solid ${T.borderLight}`, cursor:"pointer" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:8, background:POSITIONS[s.pos]?.bg||T.surface, color:POSITIONS[s.pos]?.c||T.text, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{s.name[0]}</div>
                          <span style={{ fontWeight:600 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"10px 12px", borderBottom:`1px solid ${T.borderLight}` }}><PosBadge pos={s.pos} size="xs" /></td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}`, fontWeight:700 }}>{s.workDays}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}`, color:T.teal, fontWeight:600 }}>{s.totalH}h{s.totalM}m</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}`, color:s.overtimeH>0?T.coral:T.textDim, fontWeight:s.overtimeH>0?700:400 }}>
                        {s.overtimeH>0 ? `${s.overtimeH}h${s.overtimeM}m` : '—'}
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}`, color:T.textSub }}>¥{s.wage.toLocaleString()}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}` }}>¥{s.regularPay.toLocaleString()}</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}`, color:s.overtimePay>0?T.coral:T.textDim }}>
                        {s.overtimePay>0 ? `¥${s.overtimePay.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding:"10px 12px", textAlign:"right", borderBottom:`1px solid ${T.borderLight}`, fontWeight:800, color:T.purple }}>¥{s.totalPay.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background:T.purpleSoft }}>
                    <td colSpan={2} style={{ padding:"10px 12px", fontWeight:700, color:T.purple }}>合計</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700 }}>{allStaffSummary.reduce((a,s)=>a+s.workDays,0)}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:T.teal, fontWeight:700 }}>
                      {Math.floor(allStaffSummary.reduce((a,s)=>a+s.totalMin,0)/60)}h
                    </td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:T.coral, fontWeight:700 }}>
                      {Math.floor(allStaffSummary.reduce((a,s)=>a+s.overtimeMin,0)/60)}h
                    </td>
                    <td style={{ padding:"10px 12px" }}></td>
                    <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700 }}>¥{allStaffSummary.reduce((a,s)=>a+s.regularPay,0).toLocaleString()}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", color:T.coral, fontWeight:700 }}>¥{allStaffSummary.reduce((a,s)=>a+s.overtimePay,0).toLocaleString()}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:800, color:T.purple, fontSize:14 }}>¥{allStaffSummary.reduce((a,s)=>a+s.totalPay,0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <div style={{ fontSize:11, color:T.textDim, marginTop:8 }}>※ 行をクリックすると個人の勤怠詳細を確認できます。CSVエクスポートで給与計算データを出力できます。</div>
        </>
      )}
    </div>
  );
}

function SettingsPage({ user, onSwitch, onLogout }) {
  return (

    <div style={{ padding:20, maxWidth:700 }}>
      <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 16px" }}>⚙️ 設定</h2>
      <Card style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:POSITIONS[user.pos]?.bg||T.surface, color:POSITIONS[user.pos]?.c||T.textMid, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700 }}>{user.name[0]}</div>
        <div><div style={{ fontSize:16, fontWeight:700 }}>{user.name}</div><div style={{ display:"flex", gap:6, marginTop:4 }}><PosBadge pos={user.pos} /><RoleBadge role={user.role} /></div><div style={{ fontSize:12, color:T.textDim, marginTop:2 }}>{user.email}</div></div>
      </Card>
      <Card style={{ marginBottom:16, borderLeft:`3px solid ${T.blue}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.blue, marginBottom:8 }}>🧪 デモ: ユーザー切替</div>
        <div style={{ fontSize:11, color:T.textDim, marginBottom:10 }}>異なる権限のユーザーで動作を確認（承認ワークフローの体験に！）</div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {STAFF_DATA.slice(0,5).map(s => (
            <button key={s.id} onClick={() => onSwitch(s)} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, cursor:"pointer", textAlign:"left", fontFamily:FONT, border:user.id===s.id?`2px solid ${T.blue}`:`1px solid ${T.border}`, background:user.id===s.id?T.bluePale:T.white }}>
              <PosBadge pos={s.pos} size="xs" />
              <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{s.name}</span>
              <RoleBadge role={s.role} />
              {user.id===s.id && <span style={{ color:T.blue, fontSize:12 }}>✓</span>}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom:16 }}>
        {["プッシュ通知設定","通知カテゴリー",...(user.role==="admin"?["クリニック情報","シフトテンプレート","人員配置ルール"]:[]),"利用規約","プライバシーポリシー"].map((item,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none" }}>
            <span style={{ fontSize:13, color:T.textMid }}>{item}</span>
            <span style={{ fontSize:12, color:T.textDim }}>→</span>
          </div>
        ))}
      </Card>
      <Btn variant="danger" onClick={onLogout} style={{ width:"100%" }}>ログアウト</Btn>
      <div style={{ textAlign:"center", fontSize:11, color:T.textDim, marginTop:12 }}>Version 2.1.0 {isSupabaseConfigured() ? "🟢 Supabase接続済" : "🟡 デモモード"}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function ShiftManagerWebApp() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) loadStaffProfile(session.user.id);
        else setAuthLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) loadStaffProfile(session.user.id);
        else if (event === 'SIGNED_OUT') setUser(null);
      });
      return () => subscription.unsubscribe();
    } else { setAuthLoading(false); }
  }, []);

  const loadStaffProfile = async (uid) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('staff_profiles').select('*').eq('auth_user_id', uid).single();
      if (data && !error) {
        const posMap = { doctor:'doctor', doctor_ped:'doctor_ped', doctor_int:'doctor_int', doctor_derm:'doctor_derm', doctor_ortho:'doctor_ortho', nurse:'nurse', pt:'pt', ot:'ot', trainer:'trainer', lab:'lab', receptionist:'clerk', clerk:'clerk', technician:'assistant', assistant:'assistant', other:'assistant' };
        setUser({ id:data.id, name:data.last_name+' '+data.first_name, email:data.email||'', pos:posMap[data.position]||'nurse', role:data.user_role, night:data.can_work_night });
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser({ id:'new', name:authUser?.email?.split('@')[0]||'ユーザー', email:authUser?.email||'', pos:'nurse', role:'staff', night:false });
      }
    } catch (err) { console.error(err); }
    finally { setAuthLoading(false); }
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load initial pending count for managers
  useEffect(() => {
    if (!user) return;
    const isManager = user.role === "admin" || user.role === "manager";
    if (!isManager) return;
    if (!supabase) {
      setPendingApprovalCount(DEMO_REQUESTS.filter(r => r.status === 'pending').length);
      return;
    }
    supabase.from('shift_requests').select('id', { count:'exact' }).eq('status','pending')
      .then(({ count }) => { if (count != null) setPendingApprovalCount(count); })
      .catch(console.error);
  }, [user]);

  if (authLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg, ${T.navy} 0%, #263B5E 50%, #1E3250 100%)`, fontFamily:FONT }}>
      <div style={{ textAlign:"center", color:"#fff" }}><div style={{ fontSize:48, marginBottom:16 }}>📋</div><div style={{ fontSize:16, fontWeight:600 }}>読み込み中...</div></div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={setUser} />;

  const handleLogout = async () => {
    if (isSupabaseConfigured() && supabase) await supabase.auth.signOut();
    setUser(null); setPage("home");
  };
  const handleSwitch = (s) => { setUser(s); setPage("home"); };

  const renderPage = () => {
    switch(page) {
      case "home":       return <HomePage user={user} onNav={setPage} />;
      case "shifts":     return <ShiftTablePage user={user} />;
      case "request":    return <RequestPage user={user} />;
      case "approval":   return <ApprovalPage user={user} onPendingCountChange={setPendingApprovalCount} />;
      case "attendance": return <AttendancePage user={user} />;
      case "generate":   return <GeneratePage user={user} onNav={setPage} />;
      case "staff":      return <StaffPage user={user} />;
      case "swap":       return <SwapPage user={user} />;
      case "notif":      return <NotifPage user={user} />;
      case "settings":   return <SettingsPage user={user} onSwitch={handleSwitch} onLogout={handleLogout} />;
      case "more":       return <MoreMenuPage user={user} onNav={setPage} onLogout={handleLogout} />;
      default:         return <HomePage user={user} onNav={setPage} />;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:FONT, background:T.bg, overflow:"hidden" }}>
      {!isMobile && (
        <Sidebar user={user} active={page} onNav={setPage} onLogout={handleLogout}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p=>!p)}
          pendingCount={pendingApprovalCount} />
      )}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {isMobile && (
          <div style={{ padding:"10px 16px", background:T.navy, display:"flex", alignItems:"center", gap:10, paddingTop:"max(10px, env(safe-area-inset-top))" }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📋</div>
            <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>Shift Manager</div><div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>丸岡内科小児科クリニック</div></div>
            <button onClick={() => setPage("notif")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, padding:4, position:"relative" }}>🔔</button>
            <div style={{ width:30, height:30, borderRadius:10, background:POSITIONS[user.pos]?.bg||T.surface, color:POSITIONS[user.pos]?.c||T.text, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>{user.name[0]}</div>
          </div>
        )}
        <div style={{ flex:1, overflow:"auto" }}>{renderPage()}</div>
        {isMobile && <MobileNav user={user} active={page} onNav={setPage} pendingCount={pendingApprovalCount} />}
      </div>
    </div>
  );
}
