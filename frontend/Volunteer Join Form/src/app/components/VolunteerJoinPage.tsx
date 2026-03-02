import { useState } from "react";

// ── API ──────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("karuna_token");

async function assignVolunteer(body: object) {
    const token = getToken();
    const res = await fetch(`${API_BASE}/volunteer/assign`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data as { assignment: { track: string; reason: string; suggested_tasks: string[] } };
}

// ── Colours ──
const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    warning: "#F59E0B", success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`,
    borderRadius: 8, fontSize: 15, color: C.text, backgroundColor: C.bg,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
    fontFamily: "'Inter', sans-serif",
};

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600, color: C.muted,
    letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8,
};

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>
                {label} {!optional && <span style={{ color: C.danger }}>*</span>}
                {optional && <span style={{ color: C.muted, fontWeight: 400, fontSize: 11, textTransform: "none" }}> (optional)</span>}
            </label>
            {children}
        </div>
    );
}

const VEHICLE_OPTIONS = ["None", "Car", "Bike", "Van", "Truck", "Ambulance"];
const AVAIL_OPTIONS = [
    { id: "2hrs", label: "2 Hours", icon: "⏱️" },
    { id: "halfday", label: "Half Day", icon: "🌤️" },
    { id: "fullday", label: "Full Day", icon: "📅" },
    { id: "2plus", label: "2+ Days", icon: "🗓️" },
];
const ROLE_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
    NURSE: { icon: "🏥", label: "Nurse Volunteer", color: C.primary },
    DRIVER: { icon: "🚗", label: "Driver Volunteer", color: C.warning },
    HELPER: { icon: "🤝", label: "Helper Volunteer", color: C.success },
};

export function VolunteerJoinPage() {
    const [profession, setProfession] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("None");
    const [customVehicle, setCustomVehicle] = useState("");
    const [medEquipment, setMedEquipment] = useState("");
    const [medFit, setMedFit] = useState<"yes" | "no" | "">("");
    const [availability, setAvailability] = useState("");
    const [disasterKnowledge, setDisasterKnowledge] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<{ track: string; reason: string; suggested_tasks: string[] } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await assignVolunteer({
                profession: profession.trim() || "General Volunteer",
                vehicle_availability: customVehicle.trim() || selectedVehicle,
                medical_equipment: medEquipment,
                medical_fitness: medFit,
                availability_duration: availability,
                disaster_knowledge: disasterKnowledge,
            });
            setResult(data.assignment);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            if (msg.includes("401") || msg.toLowerCase().includes("authorized")) {
                setError("You need to be logged in. Please sign in first.");
            } else if (msg.includes("0") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
                setError("Cannot reach backend. Make sure the server is running on port 5000.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const currentRole = result ? (ROLE_DISPLAY[result.track] ?? ROLE_DISPLAY.HELPER) : null;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* Navbar */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                        <img src="/logo.png" alt="Karuna Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                        <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>Karuna</span>
                    </a>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🆘 Help Me</button>
                        <button style={{ backgroundColor: C.secondary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Donate</button>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 16px 56px" }}>
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Volunteer Form</p>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Join & Get Your Role</h1>
                    <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Our AI will assign you the best role based on your profile.</p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ backgroundColor: `${C.danger}10`, border: `1px solid ${C.danger}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span>⚠️</span>
                        <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>{error}</p>
                    </div>
                )}

                {/* Result card */}
                {result && currentRole && (
                    <div style={{ backgroundColor: C.card, borderRadius: 14, border: `2px solid ${currentRole.color}`, boxShadow: `0 4px 20px ${currentRole.color}22`, padding: "24px", marginBottom: 20, textAlign: "center", animation: "fadeIn 0.4s ease" }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>{currentRole.icon}</div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: currentRole.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>AI Assignment ✨</p>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 10px" }}>You are a {currentRole.label}!</h2>
                        <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>{result.reason}</p>
                        {result.suggested_tasks.length > 0 && (
                            <div style={{ textAlign: "left", backgroundColor: C.bg, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Your tasks:</p>
                                {result.suggested_tasks.map((t, i) => (
                                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                        <span style={{ color: currentRole.color, fontWeight: 700 }}>•</span>
                                        <span style={{ fontSize: 13, color: C.text }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => {
                                const track = result?.track;
                                if (track === "NURSE") window.location.href = "/nurse";
                                else if (track === "DRIVER") window.location.href = "/driver";
                                else window.location.href = "/";
                            }}
                            style={{ width: "100%", padding: "12px 0", backgroundColor: currentRole.color, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                        >
                            Go to My Workspace →
                        </button>
                    </div>
                )}

                {/* Form */}
                {!result && (
                    <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Your Details</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>

                            <Field label="Your Profession / Skills">
                                <input style={inputStyle} type="text" placeholder="e.g. Nurse, Driver, Student, Engineer..." value={profession} onChange={e => setProfession(e.target.value)}
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Vehicle Availability">
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                                    {VEHICLE_OPTIONS.map(v => (
                                        <button key={v} type="button" onClick={() => { setSelectedVehicle(v); setCustomVehicle(""); }}
                                            style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${selectedVehicle === v ? C.primary : C.border}`, backgroundColor: selectedVehicle === v ? `${C.primary}18` : C.bg, color: selectedVehicle === v ? C.primary : C.text, fontSize: 13, fontWeight: selectedVehicle === v ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                                <input style={inputStyle} type="text" placeholder="Or type custom vehicle type..." value={customVehicle} onChange={e => { setCustomVehicle(e.target.value); setSelectedVehicle(""); }}
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Medical Equipment" optional>
                                <input style={inputStyle} type="text" placeholder="e.g. First aid kit, stethoscope..." value={medEquipment} onChange={e => setMedEquipment(e.target.value)}
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Medically Fit to Volunteer">
                                <div style={{ display: "flex", gap: 12 }}>
                                    {(["yes", "no"] as const).map(opt => (
                                        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${medFit === opt ? C.primary : C.border}`, backgroundColor: medFit === opt ? `${C.primary}12` : C.bg, flex: 1, transition: "all 0.15s" }}>
                                            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${medFit === opt ? C.primary : C.border}`, backgroundColor: medFit === opt ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                {medFit === opt && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#fff" }} />}
                                            </div>
                                            <input type="radio" name="medFit" value={opt} checked={medFit === opt} onChange={() => setMedFit(opt)} style={{ display: "none" }} />
                                            <span style={{ fontSize: 15, fontWeight: 600, color: medFit === opt ? C.primary : C.text, textTransform: "capitalize" }}>{opt === "yes" ? "Yes ✓" : "No ✗"}</span>
                                        </label>
                                    ))}
                                </div>
                            </Field>

                            <Field label="Availability Duration">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {AVAIL_OPTIONS.map(opt => (
                                        <button key={opt.id} type="button" onClick={() => setAvailability(opt.id)}
                                            style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${availability === opt.id ? C.primary : C.border}`, backgroundColor: availability === opt.id ? `${C.primary}12` : C.bg, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", textAlign: "left" }}>
                                            <span style={{ fontSize: 22 }}>{opt.icon}</span>
                                            <span style={{ fontSize: 14, fontWeight: availability === opt.id ? 700 : 600, color: availability === opt.id ? C.primary : C.text }}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <Field label="Disaster Management Knowledge" optional>
                                <select style={{ ...inputStyle, cursor: "pointer" }} value={disasterKnowledge} onChange={e => setDisasterKnowledge(e.target.value)}
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)}>
                                    <option value="">Select experience level</option>
                                    <option value="none">None</option>
                                    <option value="basic">Basic</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="expert">Expert</option>
                                </select>
                            </Field>

                            <button type="submit" disabled={loading}
                                style={{ width: "100%", padding: "13px 0", backgroundColor: loading ? C.muted : C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.15s" }}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = C.primaryHover; }}
                                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = C.primary; }}>
                                {loading ? (
                                    <><span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Assigning Role via AI…</>
                                ) : "Join & Get Role →"}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
