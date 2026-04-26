import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Users } from "../utils/api";

function PinPad({ user, onSuccess, onBack }) {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const { login } = useAuth();

  async function press(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      try {
        await login(user.id, next);
        onSuccess();
      } catch {
        setError("Incorrect PIN"); setShake(true);
        setTimeout(() => { setPin(""); setError(""); setShake(false); }, 700);
      }
    }
  }

  const S = {
    wrap:   { display:"flex", flexDirection:"column", alignItems:"center", gap:24 },
    avatar: { width:68, height:68, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#fff",
              background: user.role === "admin" ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#6366f1,#8b5cf6)" },
    dots:   { display:"flex", gap:14, animation: shake ? "shake 0.35s" : "none" },
    dot:    (i) => ({ width:15, height:15, borderRadius:"50%", background: pin.length > i ? "#6366f1" : "#e2e8f0", transition:"background 0.12s" }),
    grid:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 },
    btn:    (d) => ({ width:66, height:66, borderRadius:14, border:"2px solid #e2e8f0", background: d===""?"transparent":"#f8fafc",
                      fontSize: d==="⌫"?20:22, fontWeight:600, cursor: d===""?"default":"pointer", color:"#1e1b4b" }),
  };

  return (
    <div style={S.wrap}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
        <div style={S.avatar}>{user.avatar}</div>
        <div style={{ fontWeight:800, fontSize:18, color:"#1e1b4b" }}>{user.name}</div>
        <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:2 }}>{user.role}</div>
      </div>
      <div style={S.dots}>{[0,1,2,3].map(i=><div key={i} style={S.dot(i)} />)}</div>
      {error && <div style={{ color:"#ef4444", fontSize:13, fontWeight:600 }}>{error}</div>}
      <div style={S.grid}>
        {[1,2,3,4,5,6,7,8,9,"","0","⌫"].map((d,i)=>(
          <button key={i} style={S.btn(d)}
            onClick={()=>{ if(d==="⌫") setPin(p=>p.slice(0,-1)); else if(d!=="") press(String(d)); }}>
            {d}
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#94a3b8", fontSize:13, textDecoration:"underline" }}>← Back</button>
    </div>
  );
}

export default function LoginPage() {
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState(null);
  const { user }    = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/admin" : "/employee", { replace:true });
  }, [user]);

  useEffect(() => {
    Users.list().then(r => setUsers(r.data)).catch(()=>{});
  }, []);

  function handleSuccess() {
    // navigation handled by useEffect above via AuthCtx update
  }

  if (selected) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4ff,#faf5ff)" }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"48px 44px", boxShadow:"0 20px 60px rgba(99,102,241,0.15)", width:360 }}>
        <PinPad user={selected} onSuccess={handleSuccess} onBack={()=>setSelected(null)} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4ff,#faf5ff)", padding:24 }}>
      <div style={{ marginBottom:40, textAlign:"center" }}>
        <div style={{ fontSize:38, fontWeight:900, letterSpacing:-1.5, color:"#1e1b4b" }}>TimeFlow</div>
        <div style={{ fontSize:14, color:"#94a3b8", marginTop:6 }}>Employee Time & Task Tracker · Paralox Media</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14, maxWidth:620, width:"100%" }}>
        {users.map(u => (
          <button key={u.id} onClick={()=>setSelected(u)}
            style={{ background:"#fff", border:"2px solid #e2e8f0", borderRadius:20, padding:"22px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, transition:"all 0.2s", boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#6366f1"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.transform="translateY(0)"; }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background: u.role==="admin"?"linear-gradient(135deg,#f59e0b,#ef4444)":"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff" }}>{u.avatar}</div>
            <div style={{ fontWeight:700, color:"#1e1b4b", fontSize:13 }}>{u.name}</div>
            <div style={{ fontSize:10, color:"#94a3b8", textTransform:"uppercase", letterSpacing:1 }}>{u.role}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop:28, fontSize:12, color:"#c7d2fe" }}>Select your profile to get started</div>
    </div>
  );
}
