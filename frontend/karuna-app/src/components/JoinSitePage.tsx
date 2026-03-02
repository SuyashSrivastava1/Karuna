import { useNavigate } from "react-router-dom";

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", danger: "#EF4444", warning: "#F59E0B",
    success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

export function JoinSitePage() {
    const navigate = useNavigate();

    const roles = [
        { id: "volunteer", title: "Volunteer", desc: "Join our on-ground task force", icon: "🤝" },
        { id: "doctor", title: "Doctor", desc: "Provide medical expertise", icon: "🩺" },
        { id: "pharmacy", title: "Pharmacy", desc: "Supply essential medicines", icon: "💊" },
    ];

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ backgroundColor: C.card, padding: 40, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: 480, width: "100%", textAlign: "center" }}>
                <a href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
                    <img src="/logo.png" alt="Karuna" style={{ height: 40, width: "auto" }} />
                </a>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>Join Karuna</h1>
                <p style={{ fontSize: 15, color: C.muted, margin: "0 0 30px" }}>Select your role to register and start helping your community.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {roles.map(r => (
                        <button key={r.id} onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 2px 8px ${C.primary}20`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                            <span style={{ fontSize: 28 }}>{r.icon}</span>
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{r.title}</p>
                                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{r.desc}</p>
                            </div>
                            <span style={{ marginLeft: "auto", color: C.primary, fontSize: 20 }}>→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
