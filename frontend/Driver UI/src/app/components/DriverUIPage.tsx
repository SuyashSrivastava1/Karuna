import { useState } from "react";

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    warning: "#F59E0B", success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const readOnlyStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    border: `1px solid ${C.border}`, borderRadius: 10,
    fontSize: 15, color: C.muted, backgroundColor: "#f3f4f6",
    fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
};

export function DriverUIPage() {
    const [volunteered, setVolunteered] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Simulated system-filled dispatch details
    const dispatch = {
        location: "Central Pharmacy, 456 Elm Street, Sector 7",
        eta: "15 mins",
        deliverTo: "Camp B — General Hospital Relief Zone",
        priority: "urgent" as "urgent" | "normal",
    };

    const handleVolunteer = () => {
        setVolunteered(true);
        // Simulate opening maps
        setTimeout(() => {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(dispatch.location)}`, "_blank");
        }, 800);
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* Nav */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img src="/logo.png" alt="Karuna Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                        <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>Karuna</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🆘 Help Me</button>
                        <button style={{ backgroundColor: C.secondary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Donate</button>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 56px" }}>

                {/* Priority banner if urgent */}
                {dispatch.priority === "urgent" && (
                    <div style={{ backgroundColor: `${C.danger}12`, border: `1.5px solid ${C.danger}44`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>🔴</span>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.danger, margin: 0 }}>MANDATORY DELIVERY</p>
                            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>This site has a critical shortage. Delivery cannot be skipped.</p>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Driver Dispatch</p>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>🚗 Your Delivery Task</h1>
                </div>

                {/* Dispatch Details Card */}
                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, backgroundColor: `${C.primary}08` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.primary, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>System-Generated Dispatch Details</p>
                        <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Auto-filled by the AI dispatch system.</p>
                    </div>

                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>📍 Location to Pickup</label>
                            <div style={{ ...readOnlyStyle, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ flex: 1 }}>{dispatch.location}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, cursor: "pointer", flexShrink: 0, textDecoration: "underline" }}
                                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(dispatch.location)}`, "_blank")}>
                                    Open Map
                                </span>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>⏱️ Estimated Time to Pickup</label>
                            <div style={{ ...readOnlyStyle, fontWeight: 700, color: C.text, fontSize: 18 }}>
                                {dispatch.eta}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>🏥 Deliver To</label>
                            <div style={readOnlyStyle}>{dispatch.deliverTo}</div>
                        </div>
                    </div>
                </div>

                {/* Decision Area */}
                {!volunteered ? (
                    <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "24px 20px", textAlign: "center" }}>
                        <p style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>Are you willing to</p>
                        <p style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>accept this delivery and proceed to the pickup location?</p>
                        <button
                            onClick={handleVolunteer}
                            style={{
                                width: "100%", padding: "14px 0",
                                backgroundColor: C.primary, color: "#fff",
                                border: "none", borderRadius: 12,
                                fontSize: 16, fontWeight: 800, cursor: "pointer",
                                letterSpacing: "0.02em", transition: "all 0.15s",
                                boxShadow: `0 4px 20px ${C.primary}44`,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.primary)}
                        >
                            🚗 Volunteer for This Delivery
                        </button>
                        <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>Tapping this will open Maps with your destination pre-loaded.</p>
                    </div>
                ) : (
                    <div style={{ backgroundColor: `${C.success}12`, border: `1.5px solid ${C.success}`, borderRadius: 14, padding: "24px 20px", textAlign: "center", animation: "fadeIn 0.3s ease" }}>
                        <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
                        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>Task Accepted!</p>
                        <p style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>Opening Maps with your pickup location…</p>
                        {!confirmed && (
                            <button
                                onClick={() => setConfirmed(true)}
                                style={{ padding: "12px 28px", backgroundColor: C.success, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                            >
                                Mark as Delivered ✓
                            </button>
                        )}
                        {confirmed && <p style={{ fontSize: 15, fontWeight: 700, color: C.success }}>✓ Delivery Confirmed! Great work.</p>}
                    </div>
                )}
            </div>

            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
}
