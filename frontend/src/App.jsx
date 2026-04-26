import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage      from "./pages/LoginPage";
import EmployeePage   from "./pages/EmployeePage";
import AdminLayout    from "./pages/admin/AdminLayout";
import AdminOverview  from "./pages/admin/AdminOverview";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminReports   from "./pages/admin/AdminReports";

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4ff,#faf5ff)" }}>
      <div style={{ width:44, height:44, border:"4px solid #e2e8f0", borderTop:"4px solid #6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/employee"} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/employee" element={<Guard role="employee"><EmployeePage /></Guard>} />
          <Route path="/admin" element={<Guard role="admin"><AdminLayout /></Guard>}>
            <Route index        element={<AdminOverview />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="reports"   element={<AdminReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
