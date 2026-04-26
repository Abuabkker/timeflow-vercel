import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate("/"); }

  const navStyle = ({ isActive }) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 16px", borderRadius: 12, textDecoration: "none",
    fontSize: 14, fontWeight: 600, transition: "all 0.15s",
    background: isActive ? "#ede9fe" : "transparent",
    color: isActive ? "#6366f1" : "#64748b",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#f0f4ff,#faf5ff)" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#1e1b4b", display: "flex", flexDirection: "column", padding: "24px 16px", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ marginBottom: 32, paddingLeft: 4 }}>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5, color: "#fff" }}>TimeFlow</div>
          <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginTop: 2 }}>ADMIN PANEL</div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { to: "/admin",            label: "Live Overview", icon: "◉" },
            { to: "/admin/employees",  label: "Employees",     icon: "👤" },
            { to: "/admin/reports",    label: "Reports",       icon: "📊" },
          ].map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === "/admin"} style={navStyle}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid #312e81", paddingTop: 16, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{user?.avatar}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#e0e7ff" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "#6366f1" }}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: "100%", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700 }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
