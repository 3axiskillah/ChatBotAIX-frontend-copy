// src/App.tsx
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Import the AuthProvider
import ChatUI from "./pages/ChatUI";
import Landing from "./Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Modal from "./components/Modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Settings from "./components/Settings";
import Addons from "./pages/Addons";

// Admin Layout + Pages
import AdminLayout from "./layouts/AdminLayout";
import UsersPage from "./pages/admin/UsersPage";
import ChatSessionsPage from "./pages/admin/ChatSessionsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import AnonymousActivityPage from "./pages/admin/AnonymousActivityPage";
import BillingPage from "./pages/admin/BillingPage";
import ChatSessionDetail from "./pages/admin/ChatSessionDetail";
import DashboardPage from "./pages/admin/DashboardPage";
import EmailVerifyPage from "./pages/EmailVerifyPage";
import ActivationProcessor from "./pages/ActivationProcessor";

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        {" "}
        {/* Wrap everything with AuthProvider */}
        <ToastContainer />
        <Routes>
          <Route
            path="/"
            element={
              <Landing
                onRegisterClick={() => setShowRegister(true)}
                onLoginClick={() => setShowLogin(true)}
              />
            }
          />
          <Route path="/chat" element={<ChatUI />} />
          <Route path="/addons" element={<Addons />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/accounts/email-verify" element={<EmailVerifyPage />} />
          <Route
            path="/accounts/activate/:uidb64/:token/"
            element={<ActivationProcessor />}
          />

          {/* Admin Layout Wrapper */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="sessions" element={<ChatSessionsPage />} />
            <Route path="sessions/:sessionId" element={<ChatSessionDetail />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="anonymous" element={<AnonymousActivityPage />} />
            <Route path="billing" element={<BillingPage />} />
          </Route>
        </Routes>
        {/* Modals */}
        {showRegister && (
          <Modal onClose={() => setShowRegister(false)}>
            <Register
              onSwitchToLogin={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
              onClose={() => setShowRegister(false)}
            />
          </Modal>
        )}
        {showLogin && (
          <Modal onClose={() => setShowLogin(false)}>
            <Login onClose={() => setShowLogin(false)} />
          </Modal>
        )}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
