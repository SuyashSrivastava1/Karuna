import { useState } from "react";

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    warning: "#F59E0B", success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

// ── Vehicle Icons ─────────────────────────────────────────────────────────────
const VEHICLE_ICONS: Record<string, string> = {
    car: "🚗", truck: "🚚", bike: "🏍️", van: "🚐", auto: "🛺",
};

// ── Simulated task data ───────────────────────────────────────────────────────
interface DeliveryTask {
    id: string;
    location: string;
    destination: string;
    eta: string;
    urgency: "critical" | "high" | "moderate";
    items: string;
}

const MANDATORY_TASK: DeliveryTask = {
    id: "m1",
    location: "Central Pharmacy, 456 Elm Street, Sector 7",
    destination: "Camp B — General Hospital Relief Zone",
    eta: "15 mins",
    urgency: "critical",
    items: "Insulin x2, Saline 500ml x3",
};

const AVAILABLE_TASKS: DeliveryTask[] = [
    { id: "t1", location: "City Hospital Pharmacy", destination: "Relief Camp A", eta: "8 mins", urgency: "critical", items: "Oxygen Cylinders x2" },
    { id: "t2", location: "MedPlus, Ring Road", destination: "Shelter B", eta: "12 mins", urgency: "high", items: "Bandages x20, Antiseptic x5" },
    { id: "t3", location: "Apollo Pharmacy, Sector 5", destination: "Camp C", eta: "20 mins", urgency: "moderate", items: "ORS Packets x50" },
    { id: "t4", location: "District Medical Store", destination: "Camp D", eta: "25 mins", urgency: "high", items: "Paracetamol x100" },
    { id: "t5", location: "Jan Aushadhi, Main Rd", destination: "Shelter E", eta: "18 mins", urgency: "critical", items: "IV Drips x10" },
    { id: "t6", location: "Wellness Pharmacy", destination: "Camp F", eta: "30 mins", urgency: "moderate", items: "Vitamins, Electrolytes" },
];

const urgencyConfig = (u: DeliveryTask["urgency"]) => ({
    critical: { color: C.danger, border: "#EF4444", glow: "0 0 12px #EF444444", label: "🔴 Critical", bg: `${C.danger}10` },
    high: { color: C.warning, border: "#F59E0B", glow: "0 0 12px #F59E0B44", label: "🟡 High", bg: `${C.warning}10` },
    moderate: { color: C.success, border: "#22C55E", glow: "0 0 12px #22C55E44", label: "🟢 Moderate", bg: `${C.success}10` },
}[u]);

// ── Main Driver UI ────────────────────────────────────────────────────────────
export function DriverUIPage() {
    const [mode, setMode] = useState<"mandatory" | "choice">("mandatory");
    const [selectedTask, setSelectedTask] = useState<DeliveryTask | null>(null);
    const vehicleType = localStorage.getItem("karuna_vehicle") || "car";
    const vehicleIcon = VEHICLE_ICONS[vehicleType] || "🚗";

    const handleConfirm = () => {
        window.location.href = "/driver/active";
    };

    const handleVolunteer = (task: DeliveryTask) => {
        setSelectedTask(task);
        setMode("mandatory");
    };

    const activeTask = selectedTask || MANDATORY_TASK;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 56px" }}>

                {/* Mode Toggle */}
                <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", borderRadius: 10, border: `1px solid ${C.border}`, padding: 4, width: "fit-content" }}>
                    <button onClick={() => setMode("mandatory")} style={{
                        padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                        background: mode === "mandatory" ? C.primary : "transparent",
                        color: mode === "mandatory" ? "#fff" : C.muted,
                    }}>📋 Mandatory Delivery</button>
                    <button onClick={() => { setMode("choice"); setSelectedTask(null); }} style={{
                        padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                        background: mode === "choice" ? C.primary : "transparent",
                        color: mode === "choice" ? "#fff" : C.muted,
                    }}>🗂️ Choose a Task</button>
                </div>

                {/* ═══ MODE A: MANDATORY DELIVERY ═══ */}
                {mode === "mandatory" && (
                    <>
                        {/* Mandatory Banner */}
                        <div style={{
                            background: "linear-gradient(90deg, #fdf2f8, #fce7f3)", border: "1.5px solid #f9a8d4",
                            borderRadius: 12, padding: "12px 18px", marginBottom: 20,
                            display: "flex", alignItems: "center", gap: 12,
                        }}>
                            <span style={{ fontSize: 20 }}>⚠️</span>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#be185d", margin: 0 }}>Showing mandatory delivery</p>
                                <p style={{ fontSize: 12, color: "#9d174d", margin: 0, opacity: 0.8 }}>This task has been directly assigned to you by the system.</p>
                            </div>
                        </div>

                        {/* Header with vehicle icon */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, background: `${C.primary}12`,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                            }}>{vehicleIcon}</div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Delivery Tasks</p>
                                <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Your Assigned Delivery</h1>
                            </div>
                        </div>

                        {/* Task Card */}
                        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden", maxWidth: 480 }}>
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                                {/* Pickup Location */}
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>📍 Location to Pickup</label>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
                                        background: "#f3f4f6", borderRadius: 10, border: `1px solid ${C.border}`,
                                    }}>
                                        <span style={{ flex: 1, fontSize: 14, color: C.text }}>{activeTask.location}</span>
                                        <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeTask.location)}`, "_blank")}
                                            style={{
                                                padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.primary}`,
                                                background: `${C.primary}10`, color: C.primary, fontSize: 11, fontWeight: 700,
                                                cursor: "pointer", flexShrink: 0,
                                            }}>🗺️ map</button>
                                    </div>
                                    <p style={{ fontSize: 10, color: C.muted, marginTop: 4, fontStyle: "italic" }}>Route preview only — not turn-by-turn navigation</p>
                                </div>

                                {/* ETA */}
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>⏱️ Estimated Time</label>
                                    <div style={{
                                        padding: "12px 14px", background: "#f3f4f6", borderRadius: 10,
                                        border: `1px solid ${C.border}`, fontWeight: 800, fontSize: 20, color: C.text,
                                    }}>{activeTask.eta}</div>
                                </div>

                                {/* Deliver To */}
                                <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>🏥 Deliver To</label>
                                    <div style={{
                                        padding: "12px 14px", background: "#f3f4f6", borderRadius: 10,
                                        border: `1px solid ${C.border}`, fontSize: 14, color: C.text,
                                    }}>{activeTask.destination}</div>
                                </div>
                            </div>

                            {/* Confirm CTA */}
                            <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, background: `${C.primary}06` }}>
                                <button onClick={handleConfirm} style={{
                                    width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                                    background: C.primary, color: "#fff", fontSize: 16, fontWeight: 800,
                                    cursor: "pointer", transition: "all 0.15s",
                                    boxShadow: `0 4px 20px ${C.primary}44`,
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = C.primaryHover)}
                                    onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
                                >{vehicleIcon} Confirm & Start Navigation →</button>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ MODE B: MULTIPLE CHOICES ═══ */}
                {mode === "choice" && (
                    <>
                        <div style={{ marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>🗂️ Available Tasks</h1>
                            <p style={{ fontSize: 13, color: C.muted }}>Sorted by descending urgency — pick one to volunteer</p>
                        </div>

                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: 16,
                        }}>
                            {[...AVAILABLE_TASKS]
                                .sort((a, b) => {
                                    const o = { critical: 0, high: 1, moderate: 2 };
                                    return o[a.urgency] - o[b.urgency];
                                })
                                .map(task => {
                                    const uc = urgencyConfig(task.urgency);
                                    return (
                                        <div key={task.id} style={{
                                            background: C.card, borderRadius: 14, overflow: "hidden",
                                            border: `2px solid ${uc.border}`, boxShadow: uc.glow,
                                            transition: "all 0.2s", cursor: "pointer",
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `${uc.glow}, 0 8px 24px rgba(0,0,0,0.1)`; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = uc.glow; }}
                                        >
                                            {/* Card Header */}
                                            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>📍 {task.location.split(",")[0]}</span>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 700, padding: "2px 10px",
                                                        borderRadius: 20, background: uc.bg, color: uc.color,
                                                    }}>{uc.label}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{task.location}</p>
                                            </div>

                                            {/* Card Body */}
                                            <div style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                    <div>
                                                        <p style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", margin: "0 0 2px" }}>Items</p>
                                                        <p style={{ fontSize: 12, color: C.text, fontWeight: 500, margin: 0 }}>{task.items}</p>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <p style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", margin: "0 0 2px" }}>ETA</p>
                                                        <p style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: 0 }}>{task.eta}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <div style={{ padding: "0 16px 14px" }}>
                                                <button onClick={() => handleVolunteer(task)} style={{
                                                    width: "100%", padding: "10px 0", borderRadius: 8,
                                                    border: `1.5px solid ${uc.color}`, background: "transparent",
                                                    color: uc.color, fontSize: 13, fontWeight: 700, cursor: "pointer",
                                                    transition: "all 0.15s",
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = uc.color; e.currentTarget.style.color = "#fff"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = uc.color; }}
                                                >🤝 Volunteer</button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
