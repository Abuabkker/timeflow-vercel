import { useState, useEffect } from "react";
import { Users, Sessions } from "../../utils/api";
import { statusBadge, todayKey } from "../../utils/helpers";

function Modal({ existing, onSave, onClose }) {
  const [name,       setName]       = useState(existing?.name  || "");
  const [pin,        setPin]        = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [email,      setEmail]      = useState(existing?.email || "");
  const [error,      setError]      = useState("");
  const [saving,     setSaving]     = useState(false);

  async function handleSave() {
    if (!name.trim())              { setError("Name is required.");          return; }
    if (!/^\d{4}$/.test(pin))      { setError("PIN must be exactly 4 digits."); return; }
    if (pin !== pinConfirm)        { setError("PINs do not match.");         return; }
    setSaving(true);
    try { await onSave({ name: name.trim(), pin, email }); }
    catch (e) { setError(e.response?.data?.message || "Error saving"); setSaving(false); }
  }

  const inp = { width: "100%", border: "2px solid #e2e8f0", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,10,40,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(99,102,241,0.2)" }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#1e1b4b", marginBottom: 4 }}>{existing ? "Edit Employee" : "Add Employee"}</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 22 }}>{existing ? "Update details or reset PIN." : "Create a new employee login."}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Full Name",     val: name,       set: setName,       type: "text",     ph: "e.g. Sara Malik" },
            { label: "Email (optional)", val: email,   set: setEmail,      type: "email",    ph: "sara@paraloxmedia.com" },
            { label: existing ? "New PIN" : "4-Digit PIN", val: pin, set: v=>setPin(v.replace(/\D/g,"").slice(0,4)), type: "password", ph: "4 digits", mode: "numeric" },
            { label: "Confirm PIN",   val: pinConfirm, set: v=>setPinConfirm(v.replace(/\D/g,"").slice(0,4)), type: "password", ph: "Repeat PIN", mode: "numeric" },
          ].map(({ label, val, set, type, ph, mode }) => (
            <div key={label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}</label>
              <input value={val} onChange={e => set(e.target.value)} type={type} inputMode={mode} placeholder={ph} style={inp}
                onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>
          ))}
          {error && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, border: "2px solid #e2e8f0", background: "#fff", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, color: "#64748b" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : existing ? "Save Changes" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmployees() {
  const [employees,    setEmployees]    = useState([]);
  const [todaySessions,setTodaySessions]= useState({});
  const [showModal,    setShowModal]    = useState(false);
  const [editingUser,  setEditingUser]  = useState(null);
  const [deleteConfirm,setDeleteConfirm]= useState(null);
  const [loading,      setLoading]      = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [usersRes, sessRes] = await Promise.all([
        Users.full(),
        Sessions.admin(),
      ]);
      setEmployees(usersRes.data.filter(u => u.role === "employee"));
      const map = {};
      sessRes.data.forEach(s => { if (s.user) map[s.user.id] = s; });
      setTodaySessions(map);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(fields) {
    await Users.create(fields);
    setShowModal(false);
    load();
  }

  async function handleEdit(fields) {
    await Users.update(editingUser.id, fields);
    setEditingUser(null);
    load();
  }

  async function handleDelete(id) {
    await Users.remove(id);
    setDeleteConfirm(null);
    load();
  }

  return (
    <div style={{ padding: "28px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b4b", letterSpacing: -0.5 }}>Employees</h1>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Manage accounts, PINs and access.</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
          + Add Employee
        </button>
      </div>

      {loading && <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><div style={{ width: 36, height: 36, border: "4px solid #e2e8f0", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}

      {!loading && employees.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 24px", textAlign: "center", color: "#cbd5e1", border: "2px dashed #e2e8f0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>No employees yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Click "Add Employee" to create the first account.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {employees.map(emp => {
          const session = todaySessions[emp.id];
          const badge   = statusBadge(session);
          return (
            <div key={emp.id} style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{emp.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>{emp.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                  {emp.email && <span style={{ fontSize: 11, color: "#94a3b8" }}>{emp.email}</span>}
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>PIN: ••••</span>
                  <span style={{ fontSize: 11, background: badge.bg, color: badge.color, borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{badge.label} today</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditingUser(emp)} style={{ background: "#ede9fe", color: "#6366f1", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>Edit</button>
                {deleteConfirm === emp.id ? (
                  <>
                    <button onClick={() => handleDelete(emp.id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>Confirm</button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(emp.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>Remove</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal    && <Modal onSave={handleCreate}             onClose={() => setShowModal(false)} />}
      {editingUser  && <Modal existing={editingUser} onSave={handleEdit} onClose={() => setEditingUser(null)} />}
    </div>
  );
}
