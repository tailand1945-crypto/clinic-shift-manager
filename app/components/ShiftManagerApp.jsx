'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ====================================================================
//  クリニック シフト管理 Web アプリ
//  Next.js + Supabase 対応 / メールリンクでログイン / レスポンシブ
// ====================================================================

// --- Design Tokens ---
const T = {
  // Refined clinical palette - warm & trustworthy
  bg: "#F6F8FB",
  bgAlt: "#EDF1F7",
  white: "#FFFFFF",
  card: "#FFFFFF",
  surface: "#F0F3F8",

  navy: "#1B2A4A",
  navyLight: "#2D4263",
  navySoft: "#3D5580",

  blue: "#3B7DDD",
  blueLight: "#5B9AEF",
  blueSoft: "#E8F0FE",
  bluePale: "#F0F6FF",

  teal: "#0FA68E",
  tealSoft: "#E6F9F5",

  coral: "#E8625C",
  coralSoft: "#FDECEB",

  amber: "#E6A817",
  amberSoft: "#FFF8E1",

  purple: "#7C5CFC",
  purpleSoft: "#F0ECFF",

  text: "#1A2138",
  textMid: "#4A5568",
  textSub: "#718096",
  textDim: "#A0AEC0",
  textWhite: "#FFFFFF",

  border: "#E2E8F0",
  borderLight: "#EDF2F7",
  divider: "#F0F3F8",

  shadow: "0 1px 3px rgba(27,42,74,0.06), 0 1px 2px rgba(27,42,74,0.04)",
  shadowMd: "0 4px 12px rgba(27,42,74,0.08), 0 1px 3px rgba(27,42,74,0.06)",
  shadowLg: "0 10px 30px rgba(27,42,74,0.10)",
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
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
  doctor:    { l:"医師", c:"#E8625C", bg:"#FDECEB" },
  nurse:     { l:"看護師", c:"#3B7DDD", bg:"#E8F0FE" },
  assistant: { l:"助手", c:"#0FA68E", bg:"#E6F9F5" },
  clerk:     { l:"事務", c:"#E6A817", bg:"#FFF8E1" },
};

const ROLES = { admin:"管理者", manager:"マネージャー", staff:"スタッフ" };
const DOW = ["日","月","火","水","木","金","土"];

const STAFF_DATA = [
  { id:"s1", name:"田中 美咲",  pos:"doctor",    role:"admin",   night:true,  email:"tanaka@clinic.com" },
  { id:"s2", name:"佐藤 健一",  pos:"nurse",     role:"manager", night:true,  email:"sato@clinic.com" },
  { id:"s3", name:"鈴木 花子",  pos:"nurse",     role:"staff",   night:true,  email:"suzuki@clinic.com" },
  { id:"s4", name:"高橋 太郎",  pos:"nurse",     role:"staff",   night:true,  email:"takahashi@clinic.com" },
  { id:"s5", name:"伊藤 由美",  pos:"assistant", role:"staff",   night:false, email:"ito@clinic.com" },
  { id:"s6", name:"渡辺 誠",    pos:"assistant", role:"staff",   night:false, email:"watanabe@clinic.com" },
  { id:"s7", name:"山本 恵子",  pos:"clerk",     role:"staff",   night:false, email:"yamamoto@clinic.com" },
  { id:"s8", name:"中村 大輔",  pos:"doctor",    role:"staff",   night:true,  email:"nakamura@clinic.com" },
  { id:"s9", name:"小林 さくら",pos:"nurse",     role:"staff",   night:true,  email:"kobayashi@clinic.com" },
  { id:"s10",name:"加藤 翔太",  pos:"nurse",     role:"staff",   night:true,  email:"kato@clinic.com" },
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

const NOTIFS = [
  { id:1, title:"シフト公開", body:"2026年4月のシフトが公開されました", time:"3時間前", read:false, icon:"📅" },
  { id:2, title:"交換リクエスト", body:"高橋さんから4/12の交換リクエストが届いています", time:"昨日", read:false, icon:"🔄" },
  { id:3, title:"提出リマインダー", body:"5月の希望シフト提出期限まであと3日です", time:"2日前", read:true, icon:"⏰" },
  { id:4, title:"シフト変更", body:"4/15のシフトが「日勤」→「遅番」に変更されました", time:"3日前", read:true, icon:"✏️" },
];

function getDIM(y,m) { return new Date(y,m,0).getDate(); }
function getDow(y,m,d) { return new Date(y,m-1,d).getDay(); }

// ====================================================================
//  Shared Components
// ====================================================================

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
  const sizes = {
    sm: { fontSize:12, padding:"6px 12px" },
    md: { fontSize:13, padding:"10px 18px" },
    lg: { fontSize:14, padding:"12px 24px" },
  };
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

// ====================================================================
//  Login Screen
// ====================================================================

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("magic"); // magic | password
  const [pw, setPw] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Demo: quick login
  const demoLogin = (staff) => { onLogin(staff); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "magic") {
      setLoading(true);
      setTimeout(() => { setLoading(false); setSent(true); }, 1200);
    } else {
      const found = STAFF_DATA.find(s => s.email === email);
      if (found) onLogin(found);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(135deg, ${T.navy} 0%, #263B5E 50%, #1E3250 100%)`,
      fontFamily:FONT, padding:20,
    }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{
            width:64, height:64, borderRadius:16, background:"rgba(255,255,255,0.1)",
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            fontSize:28, marginBottom:12, backdropFilter:"blur(10px)",
            border:"1px solid rgba(255,255,255,0.1)",
          }}>📋</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>Shift Manager</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", margin:0 }}>クリニック スタッフ シフト管理</p>
        </div>

        {/* Login Card */}
        <div style={{
          background:"rgba(255,255,255,0.06)", borderRadius:20, padding:28,
          backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)",
        }}>
          {sent ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✉️</div>
              <div style={{ fontSize:17, fontWeight:700, color:"#fff", marginBottom:6 }}>メールを送信しました</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7 }}>
                <strong style={{color:"#fff"}}>{email}</strong> にログインリンクを送信しました。<br/>
                メールを確認してリンクをクリックしてください。
              </div>
              <button onClick={() => setSent(false)} style={{
                marginTop:20, background:"none", border:"1px solid rgba(255,255,255,0.2)",
                color:"rgba(255,255,255,0.7)", padding:"8px 20px", borderRadius:8,
                fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT,
              }}>別のメールアドレスで試す</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Mode Tabs */}
              <div style={{ display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:10,
                padding:3, marginBottom:20 }}>
                {[["magic","マジックリンク"],["password","パスワード"]].map(([k,label]) => (
                  <button key={k} type="button" onClick={() => setMode(k)} style={{
                    flex:1, padding:"8px", borderRadius:8, fontSize:12, fontWeight:600,
                    border:"none", cursor:"pointer", fontFamily:FONT, transition:"all 0.2s",
                    background: mode===k ? "rgba(255,255,255,0.12)" : "transparent",
                    color: mode===k ? "#fff" : "rgba(255,255,255,0.4)",
                  }}>{label}</button>
                ))}
              </div>

              {/* Email */}
              <label style={{ display:"block", marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)",
                  display:"block", marginBottom:6 }}>メールアドレス</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  style={{
                    width:"100%", padding:"12px 14px", borderRadius:10, fontSize:14,
                    border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)",
                    color:"#fff", outline:"none", fontFamily:FONT, boxSizing:"border-box",
                  }} />
              </label>

              {mode === "password" && (
                <label style={{ display:"block", marginBottom:14 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.6)",
                    display:"block", marginBottom:6 }}>パスワード</span>
                  <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                    placeholder="パスワードを入力"
                    style={{
                      width:"100%", padding:"12px 14px", borderRadius:10, fontSize:14,
                      border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)",
                      color:"#fff", outline:"none", fontFamily:FONT, boxSizing:"border-box",
                    }} />
                </label>
              )}

              <button type="submit" disabled={!email || loading} style={{
                width:"100%", padding:"13px", borderRadius:10, border:"none",
                background: email ? `linear-gradient(135deg, ${T.blue}, ${T.teal})` : "rgba(255,255,255,0.1)",
                color:"#fff", fontSize:14, fontWeight:700, cursor:email?"pointer":"default",
                fontFamily:FONT, transition:"all 0.2s", opacity: loading?0.6:1,
              }}>
                {loading ? "送信中..." : mode==="magic" ? "📩 ログインリンクを送信" : "ログイン"}
              </button>

              {mode === "password" && (
                <button type="button" style={{
                  width:"100%", marginTop:8, background:"none", border:"none",
                  color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", fontFamily:FONT,
                }}>パスワードを忘れた方</button>
              )}
            </form>
          )}
        </div>

        {/* Demo Quick Login */}
        <div style={{ marginTop:24, background:"rgba(255,255,255,0.04)", borderRadius:14,
          padding:16, border:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)",
            marginBottom:10, textAlign:"center" }}>🧪 デモ: クイックログイン</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {STAFF_DATA.slice(0,4).map(s => (
              <button key={s.id} onClick={() => demoLogin(s)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                borderRadius:8, border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(255,255,255,0.04)", cursor:"pointer",
                fontFamily:FONT, textAlign:"left", transition:"all 0.15s",
              }}>
                <span style={{
                  width:32, height:32, borderRadius:8, fontSize:12, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:POSITIONS[s.pos].bg, color:POSITIONS[s.pos].c,
                }}>{s.name[0]}</span>
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

// ====================================================================
//  Sidebar Navigation
// ====================================================================

function Sidebar({ user, active, onNav, onLogout, collapsed, onToggle }) {
  const items = [
    { id:"home",     icon:"🏠", label:"ホーム" },
    { id:"shifts",   icon:"📊", label:"シフト表" },
    { id:"request",  icon:"📝", label:"希望提出" },
    { id:"generate", icon:"⚡", label:"自動生成", admin:true },
    { id:"staff",    icon:"👥", label:"スタッフ" },
    { id:"swap",     icon:"🔄", label:"シフト交換" },
    { id:"notif",    icon:"🔔", label:"通知", badge:2 },
    { id:"settings", icon:"⚙️", label:"設定" },
  ];

  const w = collapsed ? 68 : 240;

  return (
    <div style={{
      width:w, minWidth:w, height:"100vh", background:T.navy,
      display:"flex", flexDirection:"column", transition:"width 0.25s ease",
      overflow:"hidden", position:"relative",
    }}>
      {/* Header */}
      <div style={{ padding:collapsed?"16px 10px":"20px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0,
          }}>📋</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>Shift Manager</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>World Wing 三宮</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button onClick={onToggle} style={{
        position:"absolute", right:-12, top:30, width:24, height:24, borderRadius:12,
        background:T.white, border:`1px solid ${T.border}`, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:10, color:T.textDim, boxShadow:T.shadow, zIndex:20,
      }}>{collapsed ? "→" : "←"}</button>

      {/* Nav Items */}
      <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
        {items.map(item => {
          const isActive = active === item.id;
          const isLocked = item.admin && user.role !== "admin";
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              title={collapsed ? item.label : ""}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding: collapsed ? "10px" : "10px 14px",
                borderRadius:10, border:"none", cursor:"pointer",
                background: isActive ? "rgba(59,125,221,0.15)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize:13, fontWeight: isActive ? 700 : 500,
                marginBottom:2, transition:"all 0.15s",
                fontFamily:FONT, textAlign:"left",
                justifyContent: collapsed ? "center" : "flex-start",
                opacity: isLocked ? 0.4 : 1,
              }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
              {!collapsed && isLocked && <span style={{ fontSize:10 }}>🔒</span>}
              {!collapsed && item.badge > 0 && (
                <span style={{
                  fontSize:9, fontWeight:700, color:"#fff", background:T.coral,
                  padding:"1px 5px", borderRadius:8,
                }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: collapsed ? "12px 8px" : "14px 16px",
        borderTop:"1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:10, flexShrink:0,
            background:POSITIONS[user.pos]?.bg || T.surface,
            color:POSITIONS[user.pos]?.c || T.textMid,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:700,
          }}>{user.name[0]}</div>
          {!collapsed && (
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#fff", overflow:"hidden",
                textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{ROLES[user.role]}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} title="ログアウト" style={{
              background:"none", border:"none", cursor:"pointer", fontSize:14,
              color:"rgba(255,255,255,0.3)", padding:4,
            }}>↗</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Bottom Nav
function MobileNav({ user, active, onNav }) {
  const items = [
    { id:"home",   icon:"🏠", label:"ホーム" },
    { id:"shifts", icon:"📊", label:"シフト" },
    { id:"request",icon:"📝", label:"希望" },
    { id:"generate",icon:"⚡",label:"生成" },
    { id:"more",   icon:"≡",  label:"メニュー" },
  ];
  return (
    <nav style={{
      display:"flex", background:T.white, borderTop:`1px solid ${T.border}`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{
          flex:1, padding:"8px 4px 6px", border:"none", background:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:2,
          color: active===it.id ? T.blue : T.textDim, fontFamily:FONT,
          transition:"color 0.15s",
        }}>
          <span style={{ fontSize:18 }}>{it.icon}</span>
          <span style={{ fontSize:9, fontWeight:active===it.id?700:500 }}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ====================================================================
//  Page: Home / Dashboard
// ====================================================================

function HomePage({ user }) {
  const today = new Date();
  const d = today.getDate();
  const todayShift = user.role==="admin" ? "day" : "morning";

  return (
    <div style={{ padding:24, maxWidth:1000 }}>
      {/* Greeting */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:T.text, margin:"0 0 4px" }}>
          おはようございます、{user.name.split(" ")[0]}さん
        </h1>
        <p style={{ fontSize:13, color:T.textSub, margin:0 }}>
          {today.getFullYear()}年{today.getMonth()+1}月{d}日（{DOW[today.getDay()]}）
        </p>
      </div>

      {/* Today Card */}
      <Card style={{
        background:`linear-gradient(135deg, ${T.navy} 0%, ${T.navySoft} 100%)`,
        border:"none", marginBottom:20, padding:24,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:6 }}>
              今日のシフト — {today.getMonth()+1}/{d}（{DOW[today.getDay()]}）
            </div>
            <div style={{ fontSize:32, fontWeight:800, color:"#fff" }}>{SHIFTS[todayShift].f}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{SHIFTS[todayShift].time}</div>
          </div>
          <div style={{
            width:64, height:64, borderRadius:16, background:"rgba(255,255,255,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:800, color:"rgba(255,255,255,0.3)",
          }}>{SHIFTS[todayShift].l}</div>
        </div>
        <div style={{ display:"flex", gap:20, marginTop:16, paddingTop:14,
          borderTop:"1px solid rgba(255,255,255,0.1)", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>👥 本日の出勤: 7名</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>🔄 交換リクエスト: 1件</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>🔔 未読通知: 2件</span>
        </div>
      </Card>

      {/* Stats Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:20 }}>
        <StatCard icon="📅" value="18日" label="今月の出勤" color={T.blue} />
        <StatCard icon="🌙" value="2回" label="夜勤回数" color={T.purple} />
        <StatCard icon="🏖️" value="12日" label="有給残日数" color={T.teal} />
        <StatCard icon="📊" value="94%" label="希望反映率" color={T.amber} />
      </div>

      {/* Upcoming + Notifications side by side on desktop */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16 }}>
        {/* Upcoming Shifts */}
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>📋 今後のシフト</div>
          {[1,2,3,4,5].map(off => {
            const fd = new Date(today); fd.setDate(d + off);
            const t = ["day","morning","late","off","night"][off%5];
            return (
              <div key={off} style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 0",
                borderTop: off>1 ? `1px solid ${T.borderLight}` : "none",
              }}>
                <div style={{ width:40, textAlign:"center" }}>
                  <div style={{ fontSize:10, fontWeight:600, color: fd.getDay()===0?T.coral:fd.getDay()===6?T.blue:T.textDim }}>{DOW[fd.getDay()]}</div>
                  <div style={{ fontSize:17, fontWeight:700 }}>{fd.getDate()}</div>
                </div>
                <ShiftBadge type={t} size="md" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{SHIFTS[t].f}</div>
                  <div style={{ fontSize:11, color:T.textDim }}>{SHIFTS[t].time}</div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>🔔 最近の通知</div>
          {NOTIFS.map((n, i) => (
            <div key={n.id} style={{
              display:"flex", gap:10, padding:"10px 0",
              borderTop: i>0 ? `1px solid ${T.borderLight}` : "none",
              opacity: n.read ? 0.6 : 1,
            }}>
              <span style={{ fontSize:20 }}>{n.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:n.read?500:700, color:T.text }}>{n.title}</div>
                <div style={{ fontSize:12, color:T.textSub, marginTop:2 }}>{n.body}</div>
                <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width:8, height:8, borderRadius:4, background:T.blue, marginTop:4 }}/>}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ====================================================================
//  Page: Shift Table
// ====================================================================

function ShiftTablePage({ user, year=2026, month=4 }) {
  const [shifts] = useState(() => genShifts(year, month));
  const [filterPos, setFilterPos] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const days = getDIM(year, month);
  const todayD = new Date().getDate();
  const isCur = new Date().getMonth()+1===month;
  const filtered = filterPos ? STAFF_DATA.filter(s => s.pos===filterPos) : STAFF_DATA;
  const canEdit = user.role==="admin"||user.role==="manager";

  const daySummary = useMemo(() => {
    const s = {};
    for (let d=1; d<=days; d++) {
      let c=0;
      STAFF_DATA.forEach(st => { const t=shifts[st.id]?.[d]; if(t&&t!=="off"&&t!=="paid") c++; });
      s[d] = c;
    }
    return s;
  }, [shifts, days]);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Toolbar */}
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0, color:T.text }}>📊 {year}年{month}月</h2>
        <span style={{ fontSize:11, fontWeight:600, color:T.teal, background:T.tealSoft,
          padding:"3px 10px", borderRadius:20 }}>公開済み</span>
        <div style={{ flex:1 }} />
        {/* Position Filters */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          <Btn size="sm" variant={!filterPos?"primary":"secondary"} onClick={() => setFilterPos(null)}>
            全員 ({STAFF_DATA.length})
          </Btn>
          {Object.entries(POSITIONS).map(([k,p]) => {
            const c = STAFF_DATA.filter(s=>s.pos===k).length;
            return (
              <Btn key={k} size="sm" variant={filterPos===k?"primary":"secondary"}
                onClick={() => setFilterPos(filterPos===k?null:k)}
                style={filterPos===k?{background:p.c}:{}}>
                {p.l} ({c})
              </Btn>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex:1, overflow:"auto", position:"relative" }}>
        <table style={{ borderCollapse:"collapse", fontSize:12, fontFamily:FONT, minWidth:"100%" }}>
          <thead>
            <tr style={{ position:"sticky", top:0, zIndex:10, background:T.surface }}>
              <th style={{
                position:"sticky", left:0, zIndex:12, background:T.surface,
                padding:"8px 10px", textAlign:"left", fontWeight:700, fontSize:11, color:T.textDim,
                borderBottom:`2px solid ${T.border}`, borderRight:`1px solid ${T.border}`,
                minWidth:120,
              }}>スタッフ</th>
              {Array.from({length:days},(_,i)=>i+1).map(d => {
                const dow = getDow(year,month,d);
                const isT = isCur && d===todayD;
                return (
                  <th key={d} style={{
                    padding:"4px 2px", textAlign:"center", fontWeight:600,
                    borderBottom:`2px solid ${T.border}`, borderRight:`1px solid ${T.borderLight}`,
                    background: isT ? T.blueSoft : T.surface, minWidth:34,
                  }}>
                    <div style={{ fontSize:9, color:dow===0?T.coral:dow===6?T.blue:T.textDim }}>{DOW[dow]}</div>
                    <div style={{ fontSize:12, fontWeight:isT?800:600, color:isT?T.blue:dow===0?T.coral:T.text }}>{d}</div>
                  </th>
                );
              })}
            </tr>
            {/* Staffing count row */}
            <tr style={{ position:"sticky", top:46, zIndex:9, background:T.white }}>
              <td style={{
                position:"sticky", left:0, zIndex:11, background:T.white,
                padding:"4px 10px", fontSize:10, fontWeight:600, color:T.textDim,
                borderBottom:`1px solid ${T.blue}30`, borderRight:`1px solid ${T.border}`,
              }}>出勤数</td>
              {Array.from({length:days},(_,i)=>i+1).map(d => (
                <td key={d} style={{
                  textAlign:"center", padding:"4px 0", fontWeight:700, fontSize:10,
                  color: daySummary[d]<5 ? T.coral : T.teal,
                  background: daySummary[d]<5 ? T.coralSoft : T.white,
                  borderBottom:`1px solid ${T.blue}30`, borderRight:`1px solid ${T.borderLight}`,
                }}>{daySummary[d]}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(staff => (
              <tr key={staff.id}>
                <td style={{
                  position:"sticky", left:0, zIndex:5, background:T.white,
                  padding:"6px 10px", borderBottom:`1px solid ${T.borderLight}`,
                  borderRight:`1px solid ${T.border}`, whiteSpace:"nowrap",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <PosBadge pos={staff.pos} size="xs" />
                    <span style={{ fontSize:12, fontWeight:600 }}>{staff.name.split(" ")[0]}</span>
                    {staff.role==="admin" && <RoleBadge role="admin" />}
                  </div>
                </td>
                {Array.from({length:days},(_,i)=>i+1).map(d => {
                  const t = shifts[staff.id]?.[d];
                  const isT = isCur && d===todayD;
                  const isSel = selectedCell?.s===staff.id && selectedCell?.d===d;
                  return (
                    <td key={d} style={{
                      textAlign:"center", padding:"3px 1px",
                      borderBottom:`1px solid ${T.borderLight}`, borderRight:`1px solid ${T.borderLight}`,
                      background: isSel ? T.blueSoft : isT ? `${T.blue}06` : "transparent",
                      cursor: canEdit ? "pointer" : "default",
                    }}
                    onClick={canEdit ? () => setSelectedCell({s:staff.id,d}) : undefined}>
                      <ShiftBadge type={t} selected={isSel} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with legend */}
      <div style={{ padding:"8px 16px", background:T.white, borderTop:`1px solid ${T.border}`,
        display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:10, color:T.textDim, fontWeight:600 }}>凡例:</span>
        {Object.entries(SHIFTS).map(([k,s]) => (
          <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:T.textSub }}>
            <span style={{ width:14, height:14, borderRadius:3, background:s.bg, color:s.c,
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              fontSize:8, fontWeight:700 }}>{s.l}</span>
            {s.f}
          </span>
        ))}
        <span style={{ marginLeft:"auto", fontSize:11, color:T.textDim }}>
          {canEdit ? "💡 セルをクリックして編集" : "閲覧のみ"}
        </span>
      </div>
    </div>
  );
}

// ====================================================================
//  Page: Shift Request
// ====================================================================

function RequestPage({ user }) {
  const [sel, setSel] = useState({});
  const [pri, setPri] = useState({});
  const [done, setDone] = useState(false);
  const year=2026, month=5;
  const days = getDIM(year,month);

  const toggle = (d,t) => {
    setSel(p => { const n={...p}; if(n[d]===t) delete n[d]; else { n[d]=t; if(!pri[d]) setPri(pp=>({...pp,[d]:1})); } return n; });
  };
  const cnt = Object.keys(sel).length;
  const offCnt = Object.values(sel).filter(v=>v==="off"||v==="paid").length;

  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      height:"100%", padding:48, textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px" }}>提出完了！</h2>
      <p style={{ fontSize:14, color:T.textSub, lineHeight:1.7, margin:0 }}>
        {month}月の希望シフトを{cnt}日分提出しました。<br/>確定後にお知らせします。
      </p>
      <Btn variant="secondary" onClick={() => setDone(false)} style={{ marginTop:20 }}>
        内容を修正する
      </Btn>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}` }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 4px" }}>📝 希望シフト提出</h2>
        <p style={{ fontSize:12, color:T.textSub, margin:0 }}>{year}年{month}月分</p>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 20px",
        background:T.amberSoft, fontSize:12, fontWeight:600, color:"#92400E" }}>
        <span>⏰ 提出期限: 4/20（月）</span>
        <span>{cnt}日選択 / 休日{offCnt}日</span>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"8px 16px" }}>
        {Array.from({length:days},(_,i)=>i+1).map(d => {
          const dow = getDow(year,month,d);
          const s = sel[d];
          return (
            <div key={d} style={{
              display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
              background: s ? T.white : "transparent", borderRadius:10, marginBottom:3,
              border: s ? `1.5px solid ${T.blue}20` : "1px solid transparent",
            }}>
              <div style={{ width:36, textAlign:"center" }}>
                <div style={{ fontSize:9, fontWeight:600, color:dow===0?T.coral:dow===6?T.blue:T.textDim }}>{DOW[dow]}</div>
                <div style={{ fontSize:15, fontWeight:700, color:dow===0?T.coral:T.text }}>{d}</div>
              </div>
              <div style={{ display:"flex", gap:3 }}>
                {Object.entries(SHIFTS).map(([k]) => (
                  <ShiftBadge key={k} type={k} selected={s===k} onClick={() => toggle(d,k)} />
                ))}
              </div>
              {s && (
                <button onClick={() => setPri(p=>({...p,[d]:((p[d]||1)%3)+1}))} style={{
                  marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:12,
                }}>
                  {Array.from({length:pri[d]||1}).map((_,i)=>(
                    <span key={i} style={{color:(pri[d]||1)>=3?T.coral:(pri[d]||1)>=2?T.amber:T.textDim}}>★</span>
                  ))}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding:"12px 20px", background:T.white, borderTop:`1px solid ${T.border}`,
        display:"flex", gap:10 }}>
        <Btn variant="secondary" onClick={() => {setSel({});setPri({});}}>リセット</Btn>
        <Btn variant="primary" disabled={cnt===0} onClick={() => setDone(true)}
          style={{ flex:1 }}>提出する（{cnt}日）</Btn>
      </div>
    </div>
  );
}

// ====================================================================
//  Page: Auto Generate (Admin Only)
// ====================================================================

function GeneratePage({ user }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState(70);
  const ref = useRef(null);
  const isAdmin = user.role === "admin";

  const startGen = () => {
    setStep(1); setProgress(0);
    ref.current = setInterval(() => {
      setProgress(p => {
        if (p>=100) { clearInterval(ref.current); setTimeout(()=>setStep(2),400); return 100; }
        return p + Math.random()*8+2;
      });
    }, 120);
  };
  useEffect(() => () => clearInterval(ref.current), []);

  if (!isAdmin) return (
    <Empty icon="🔒" title="管理者限定機能"
      sub={`シフトの自動生成は管理者アカウントでのみ実行できます。\n現在の権限: ${ROLES[user.role]}`} />
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ padding:"16px 20px", background:T.white, borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", gap:12 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>⚡ 自動シフト生成</h2>
          <span style={{ fontSize:11, fontWeight:600, color:T.blue }}>🛡️ 管理者限定</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:8, height:8, borderRadius:4,
              background:i<=step?T.blue:T.border, transition:"all 0.3s" }}/>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:20, maxWidth:800 }}>
        {step===0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>📅 対象期間</div>
              <div style={{ padding:"10px 16px", background:T.blueSoft, borderRadius:10,
                fontSize:16, fontWeight:700, color:T.blue }}>2026年4月</div>
            </Card>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>👥 提出状況</div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div>
                  <div style={{ fontSize:24, fontWeight:800 }}>8 / 10 名</div>
                  <div style={{ fontSize:12, color:T.textDim }}>提出済み（80%）</div>
                </div>
                <div style={{ flex:1, height:8, background:T.surface, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ width:"80%", height:"100%", background:T.teal, borderRadius:4 }}/>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>⚙️ 生成条件</div>
              {["医師を常時1名以上配置","看護師を常時2名以上配置","夜勤連続は最大2日まで",
                "週休2日を確保","希望優先度を考慮","公平性を最適化"].map((r,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none" }}>
                  <span style={{ fontSize:13, color:T.textMid }}>{r}</span>
                  <div style={{ width:38, height:22, borderRadius:11, background:T.teal, position:"relative", cursor:"pointer" }}>
                    <div style={{ width:18, height:18, borderRadius:9, background:"#fff",
                      position:"absolute", top:2, left:18, boxShadow:T.shadow }}/>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${T.borderLight}` }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.textSub, marginBottom:8 }}>最適化品質</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:T.textDim }}>⚡高速</span>
                  <input type="range" min={0} max={100} value={quality}
                    onChange={e=>setQuality(+e.target.value)}
                    style={{ flex:1, accentColor:T.blue }} />
                  <span style={{ fontSize:11, color:T.textDim }}>🎯高品質</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step===1 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", minHeight:400, gap:20 }}>
            <svg width={120} height={120} style={{transform:"rotate(-90deg)"}}>
              <circle cx={60} cy={60} r={54} fill="none" stroke={T.border} strokeWidth={6}/>
              <circle cx={60} cy={60} r={54} fill="none" stroke={T.blue} strokeWidth={6}
                strokeDasharray={339.3} strokeDashoffset={339.3-(Math.min(progress,100)/100)*339.3}
                strokeLinecap="round" style={{transition:"stroke-dashoffset 0.3s"}}/>
            </svg>
            <div style={{ marginTop:-90, fontSize:26, fontWeight:800, color:T.blue, fontFamily:MONO }}>
              {Math.min(Math.round(progress),100)}%
            </div>
            <div style={{ marginTop:50, fontSize:16, fontWeight:700, color:T.text }}>
              {progress<25?"データを収集中...":progress<50?"制約条件を分析中...":
               progress<75?"最適配置を計算中...":"最終調整中..."}
            </div>
            <div style={{ fontSize:13, color:T.textDim }}>
              焼きなまし法で最適なシフトを探索しています
            </div>
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
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>📊 配置サマリー</div>
              {Object.entries(POSITIONS).map(([k,p]) => {
                const c = STAFF_DATA.filter(s=>s.pos===k).length;
                return (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                    borderTop:`1px solid ${T.borderLight}` }}>
                    <PosBadge pos={k} />
                    <div style={{ flex:1, height:6, background:T.surface, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ width:`${Math.min(c/4*100,100)}%`, height:"100%", background:p.c, borderRadius:3, transition:"width 0.5s" }}/>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:T.textSub, fontFamily:MONO }}>{c}名</span>
                  </div>
                );
              })}
            </Card>
            <div style={{ textAlign:"center", fontSize:11, color:T.textDim, fontFamily:MONO }}>計算時間: 18,204ms</div>
          </div>
        )}

        {step===3 && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px", color:T.teal }}>シフト登録完了！</h2>
            <p style={{ fontSize:14, color:T.textSub, lineHeight:1.7, margin:0 }}>
              310件のシフトを登録しました。<br/>シフト表画面で確認してください。
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
              <Btn variant="primary">シフト表を確認</Btn>
              <Btn variant="secondary">シフトを公開</Btn>
            </div>
          </div>
        )}
      </div>

      {(step===0||step===2) && (
        <div style={{ padding:"12px 20px", background:T.white, borderTop:`1px solid ${T.border}`,
          display:"flex", gap:10 }}>
          {step===2 && <Btn variant="secondary" onClick={()=>setStep(0)}>やり直す</Btn>}
          <Btn variant={step===0?"primary":"success"}
            onClick={step===0?startGen:()=>setStep(3)} style={{ flex:1 }}>
            {step===0?"⚡ シフトを自動生成する":"✅ このシフトを適用する"}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ====================================================================
//  Page: Staff Management
// ====================================================================

function StaffPage({ user }) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState(null);
  const filtered = STAFF_DATA.filter(s => {
    if (filterPos && s.pos !== filterPos) return false;
    if (search && !s.name.includes(search) && !s.email.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding:20, maxWidth:1000 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>👥 スタッフ管理</h2>
        <span style={{ fontSize:12, color:T.textDim }}>{STAFF_DATA.length}名</span>
        <div style={{ flex:1 }}/>
        {user.role==="admin" && <Btn variant="primary" size="sm" icon="➕">スタッフ追加</Btn>}
      </div>

      {/* Search + Filter */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="名前・メールで検索..."
          style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`,
            fontSize:13, fontFamily:FONT, outline:"none", flex:1, minWidth:200 }} />
        <div style={{ display:"flex", gap:4 }}>
          <Btn size="sm" variant={!filterPos?"primary":"secondary"} onClick={()=>setFilterPos(null)}>全員</Btn>
          {Object.entries(POSITIONS).map(([k,p]) => (
            <Btn key={k} size="sm" variant={filterPos===k?"primary":"secondary"}
              onClick={()=>setFilterPos(filterPos===k?null:k)}
              style={filterPos===k?{background:p.c}:{}}>{p.l}</Btn>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))", gap:8, marginBottom:16 }}>
        {Object.entries(POSITIONS).map(([k,p]) => {
          const c = STAFF_DATA.filter(s=>s.pos===k).length;
          return (
            <div key={k} style={{ textAlign:"center", padding:"10px", background:p.bg, borderRadius:10 }}>
              <div style={{ fontSize:22, fontWeight:800, color:p.c }}>{c}</div>
              <div style={{ fontSize:10, color:p.c, fontWeight:600 }}>{p.l}</div>
            </div>
          );
        })}
      </div>

      {/* Staff List */}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(s => (
          <Card key={s.id} hover style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:POSITIONS[s.pos].bg, color:POSITIONS[s.pos].c,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, fontWeight:700, flexShrink:0,
            }}>{s.name[0]}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{s.name}</span>
                <PosBadge pos={s.pos} size="xs" />
                <RoleBadge role={s.role} />
              </div>
              <div style={{ fontSize:12, color:T.textDim, marginTop:2 }}>{s.email}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              {s.night && (
                <span style={{ fontSize:10, fontWeight:600, color:T.purple, background:T.purpleSoft,
                  padding:"3px 8px", borderRadius:6 }}>夜勤○</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
//  Page: Swap
// ====================================================================

function SwapPage() {
  const [tab, setTab] = useState(0);
  const swaps = [
    { id:1, from:"高橋 太郎", to:"鈴木 花子", day:"4/12", fromShift:"night", toShift:"day", status:"pending", reason:"家庭の事情" },
    { id:2, from:"佐藤 健一", to:"小林 さくら", day:"4/18", fromShift:"late", toShift:"morning", status:"accepted", reason:"" },
  ];
  return (
    <div style={{ padding:20, maxWidth:700 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>🔄 シフト交換</h2>
        <div style={{ flex:1 }}/>
        <Btn variant="primary" size="sm" icon="➕">交換リクエスト</Btn>
      </div>
      <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${T.border}` }}>
        {["受信","送信済み"].map((l,i) => (
          <button key={i} onClick={()=>setTab(i)} style={{
            padding:"10px 20px", border:"none", background:"none", cursor:"pointer",
            borderBottom: tab===i?`3px solid ${T.blue}`:"3px solid transparent",
            color: tab===i?T.text:T.textDim, fontSize:13, fontWeight:tab===i?700:500, fontFamily:FONT,
          }}>{l}</button>
        ))}
      </div>
      {swaps.map(sw => (
        <Card key={sw.id} style={{ marginBottom:10, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:14, fontWeight:700 }}>{sw.from} → {sw.to}</span>
            <span style={{
              fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20,
              background: sw.status==="pending"?T.amberSoft:T.tealSoft,
              color: sw.status==="pending"?T.amber:T.teal,
            }}>{sw.status==="pending"?"承認待ち":"承認済み"}</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, color:T.textSub }}>
            <span>{sw.day}</span>
            <ShiftBadge type={sw.fromShift} /> <span>→</span> <ShiftBadge type={sw.toShift} />
          </div>
          {sw.reason && <div style={{ fontSize:12, color:T.textDim, marginTop:6 }}>理由: {sw.reason}</div>}
          {sw.status==="pending" && (
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <Btn size="sm" variant="danger">却下</Btn>
              <Btn size="sm" variant="success">承認</Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ====================================================================
//  Page: Notifications
// ====================================================================

function NotifPage() {
  return (
    <div style={{ padding:20, maxWidth:700 }}>
      <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 16px" }}>🔔 通知</h2>
      {NOTIFS.map((n,i) => (
        <Card key={n.id} hover style={{ marginBottom:8, padding:14, opacity:n.read?0.6:1, cursor:"pointer" }}>
          <div style={{ display:"flex", gap:12 }}>
            <span style={{ fontSize:24 }}>{n.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, fontWeight:n.read?500:700 }}>{n.title}</span>
                <span style={{ fontSize:10, color:T.textDim }}>{n.time}</span>
              </div>
              <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{n.body}</div>
            </div>
            {!n.read && <div style={{ width:8, height:8, borderRadius:4, background:T.blue, marginTop:4 }}/>}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ====================================================================
//  Page: Settings
// ====================================================================

function SettingsPage({ user, onSwitch, onLogout }) {
  return (
    <div style={{ padding:20, maxWidth:700 }}>
      <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 16px" }}>⚙️ 設定</h2>

      {/* Profile */}
      <Card style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
        <div style={{
          width:52, height:52, borderRadius:14,
          background:POSITIONS[user.pos].bg, color:POSITIONS[user.pos].c,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, fontWeight:700,
        }}>{user.name[0]}</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700 }}>{user.name}</div>
          <div style={{ display:"flex", gap:6, marginTop:4 }}>
            <PosBadge pos={user.pos} />
            <RoleBadge role={user.role} />
          </div>
          <div style={{ fontSize:12, color:T.textDim, marginTop:2 }}>{user.email}</div>
        </div>
      </Card>

      {/* Demo Switch */}
      <Card style={{ marginBottom:16, borderLeft:`3px solid ${T.blue}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.blue, marginBottom:8 }}>
          🧪 デモ: ユーザー切替
        </div>
        <div style={{ fontSize:11, color:T.textDim, marginBottom:10 }}>
          異なる権限のユーザーで動作を確認できます（自動生成の🔒ロックを体験）
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {STAFF_DATA.slice(0,5).map(s => (
            <button key={s.id} onClick={() => onSwitch(s)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
              borderRadius:8, cursor:"pointer", textAlign:"left", fontFamily:FONT,
              border: user.id===s.id ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
              background: user.id===s.id ? T.bluePale : T.white,
              transition:"all 0.15s",
            }}>
              <PosBadge pos={s.pos} size="xs" />
              <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{s.name}</span>
              <RoleBadge role={s.role} />
              {user.id===s.id && <span style={{ color:T.blue, fontSize:12 }}>✓</span>}
            </button>
          ))}
        </div>
      </Card>

      {/* Settings items */}
      <Card style={{ marginBottom:16 }}>
        {["プッシュ通知設定","通知カテゴリー",
          ...(user.role==="admin" ? ["クリニック情報","シフトテンプレート","人員配置ルール"] : []),
          "利用規約","プライバシーポリシー"
        ].map((item, i) => (
          <div key={i} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 0", borderTop:i>0?`1px solid ${T.borderLight}`:"none",
          }}>
            <span style={{ fontSize:13, color:T.textMid }}>{item}</span>
            <span style={{ fontSize:12, color:T.textDim }}>→</span>
          </div>
        ))}
      </Card>

      <Btn variant="danger" onClick={onLogout} style={{ width:"100%" }}>ログアウト</Btn>
      <div style={{ textAlign:"center", fontSize:11, color:T.textDim, marginTop:12 }}>Version 1.0.0</div>
    </div>
  );
}

// ====================================================================
//  More Menu (Mobile)
// ====================================================================

function MoreMenu({ user, onNav }) {
  const items = [
    { id:"staff", icon:"👥", label:"スタッフ管理" },
    { id:"swap",  icon:"🔄", label:"シフト交換" },
    { id:"notif", icon:"🔔", label:"通知", badge:2 },
    { id:"settings", icon:"⚙️", label:"設定" },
  ];
  return (
    <div style={{ padding:20 }}>
      <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 16px" }}>メニュー</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map(it => (
          <Card key={it.id} hover onClick={() => onNav(it.id)}
            style={{ padding:14, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <span style={{ fontSize:22 }}>{it.icon}</span>
            <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{it.label}</span>
            {it.badge>0 && <span style={{ fontSize:10, fontWeight:700, color:"#fff", background:T.coral,
              padding:"2px 7px", borderRadius:10 }}>{it.badge}</span>}
            <span style={{ color:T.textDim }}>→</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
//  Main App Shell
// ====================================================================

export default function ShiftManagerWebApp() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!user) return <LoginScreen onLogin={setUser} />;

  const handleNav = (p) => setPage(p);
  const handleLogout = () => { setUser(null); setPage("home"); };
  const handleSwitch = (s) => { setUser(s); setPage("home"); };

  const renderPage = () => {
    switch(page) {
      case "home": return <HomePage user={user} />;
      case "shifts": return <ShiftTablePage user={user} />;
      case "request": return <RequestPage user={user} />;
      case "generate": return <GeneratePage user={user} />;
      case "staff": return <StaffPage user={user} />;
      case "swap": return <SwapPage />;
      case "notif": return <NotifPage />;
      case "settings": return <SettingsPage user={user} onSwitch={handleSwitch} onLogout={handleLogout} />;
      case "more": return <MoreMenu user={user} onNav={handleNav} />;
      default: return <HomePage user={user} />;
    }
  };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:FONT, background:T.bg, overflow:"hidden" }}>
      <style>{`
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar user={user} active={page} onNav={handleNav} onLogout={handleLogout}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p=>!p)} />
      )}

      {/* Main Content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            padding:"10px 16px", background:T.white, borderBottom:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <div style={{
              width:32, height:32, borderRadius:8, background:T.navy,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, color:"#fff",
            }}>📋</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>Shift Manager</div>
            </div>
            <div style={{
              width:28, height:28, borderRadius:8,
              background:POSITIONS[user.pos]?.bg, color:POSITIONS[user.pos]?.c,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700,
            }}>{user.name[0]}</div>
          </div>
        )}

        {/* Page Content */}
        <div style={{ flex:1, overflow:"auto" }}>
          {renderPage()}
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && <MobileNav user={user} active={page} onNav={handleNav} />}
      </div>
    </div>
  );
}
