import { useState } from "react";
import { useNavigate } from "react-router-dom";

declare var process: any;

export function AdminBypassPage() {
    const [secret, setSecret] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleBypass = () => {
        // Safe check for both process.env and import.meta.env
        const isNotProd = typeof process !== "undefined" && process.env
            ? process.env.NODE_ENV !== "production"
            : (import.meta as any).env?.MODE !== "production";

        if (!isNotProd) {
            setError("Bypass disabled in production mode.");
            return;
        }

        if (secret === "KARUNA_BACKDOOR_2024") {
            // override auth
            localStorage.setItem("karuna_token", "admin_bypass_token");
            localStorage.setItem("karuna_role", "doctor"); // defaulting to doctor for demo
            localStorage.setItem("karuna_user_name", "System Administrator");
            localStorage.setItem("karuna_user_email", "admin@karuna.app");
            navigate("/doctor");
        } else {
            setError("Invalid secret override string.");
        }
    };

    return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
            <div style={{ background: "#222", padding: 40, borderRadius: 12, border: "1px solid #333", width: 400, textAlign: "center" }}>
                <h1 style={{ color: "#EF4444", fontSize: 20, marginBottom: 20, fontFamily: "monospace" }}>[ ADMIN BYPASS ]</h1>
                <p style={{ color: "#aaa", fontSize: 13, marginBottom: 20, fontFamily: "monospace" }}>Enter diagnostic override key:</p>
                <input
                    type="password"
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    style={{ width: "100%", padding: 10, background: "#000", color: "#0f0", border: "1px solid #444", borderRadius: 6, marginBottom: 16, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }}
                />
                {error && <p style={{ color: "#EF4444", fontSize: 12, marginBottom: 16, fontFamily: "monospace" }}>{error}</p>}
                <button
                    onClick={handleBypass}
                    style={{ background: "#EF4444", color: "#fff", width: "100%", padding: 12, border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontFamily: "monospace", transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                    OVERRIDE AUTHENTICATION
                </button>
            </div>
        </div>
    );
}
