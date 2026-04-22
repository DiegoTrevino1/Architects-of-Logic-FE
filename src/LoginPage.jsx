import { useState } from "react";
import "./LoginPage.css";

function LoginPage({ onBack, onLoginSuccess }) {
  const [mode, setMode] = useState("login");

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">Σ</div>
            <div>
              <div className="logo-text">Architects of Logic</div>
              <div className="logo-sub">CWU · Computer Architecture</div>
            </div>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <div className="auth-body">
          {/* USERNAME (for both login + register) */}
          <div className="input-group">
            <label>Username</label>
            <input type="text" placeholder="Enter username" />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password" />
          </div>

          {/* CONFIRM PASSWORD (register only) */}
          {mode === "register" && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm password" />
            </div>
          )}

          <button className="auth-btn" onClick={onLoginSuccess}>
            {mode === "login" ? "Log In" : "Create Account"}
          </button>

          <button className="auth-back" onClick={onBack}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;