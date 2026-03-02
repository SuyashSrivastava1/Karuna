import { useState, useEffect } from "react";

// ── API ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("karuna_token");
const SITE_ID = localStorage.getItem("karuna_site_id") || "demo-site";

async function apiFetch(method: string, path: string, body?: object) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", danger: "#EF4444", warning: "#F59E0B",
    success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: `1px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.text, backgroundColor: C.bg,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s",
};

interface Prescription { name: string; dosage: string; quantity: string; }
interface Patient {
    id: string;
    tagId: string;
    urgency: "critical" | "high" | "moderate" | "stable";
    nursesDiagnosis: string;
    vitals: string;
    prescription: Prescription;
    equipmentNeeded: string;
    notesForNurse: string;
    status: "Pending" | "Fulfilled";
}

const urgencyConfig = (u: Patient["urgency"]) => ({
    critical: { color: C.danger, dot: "🔴", label: "Critical" },
    high: { color: C.warning, dot: "🟡", label: "High" },
    moderate: { color: "#8B5CF6", dot: "🟣", label: "Moderate" },
    stable: { color: C.success, dot: "🟢", label: "Stable" },
}[u]);

const INITIAL_PATIENTS: Patient[] = [
    { id: "p1", tagId: "TAG-001", urgency: "critical", nursesDiagnosis: "Severe dehydration, high fever (39.8°C), unconscious episodes. Needs IV drip immediately.", vitals: "HR: 115, BP: 85/55, Temp: 39.8°C", prescription: { name: "", dosage: "", quantity: "" }, equipmentNeeded: "", notesForNurse: "", status: "Pending" },
    { id: "p2", tagId: "TAG-003", urgency: "high", nursesDiagnosis: "Minor fracture in left arm. Stable but in pain. Splint applied.", vitals: "HR: 88, BP: 115/75, Temp: 37.2°C", prescription: { name: "", dosage: "", quantity: "" }, equipmentNeeded: "", notesForNurse: "", status: "Pending" },
    { id: "p3", tagId: "TAG-007", urgency: "moderate", nursesDiagnosis: "Mild dehydration and fatigue. Alert and responsive.", vitals: "HR: 78, BP: 120/80, Temp: 37.0°C", prescription: { name: "", dosage: "", quantity: "" }, equipmentNeeded: "", notesForNurse: "", status: "Pending" },
    { id: "p4", tagId: "TAG-009", urgency: "stable", nursesDiagnosis: "Minor cuts and bruises. No internal issues detected.", vitals: "HR: 72, BP: 118/78, Temp: 36.8°C", prescription: { name: "", dosage: "", quantity: "" }, equipmentNeeded: "", notesForNurse: "", status: "Pending" },
];

export function DoctorDashboardPage() {
    const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [sending, setSending] = useState<string | null>(null);
    const [sent, setSent] = useState<Set<string>>(new Set());

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch("GET", `/patients/${SITE_ID}`);
                if (Array.isArray(data) && data.length > 0) {
                    setPatients(data.map((p: Record<string, unknown>) => ({
                        id: p.id as string,
                        tagId: (p.tag_id || p.tagId) as string,
                        urgency: (p.triage_level || p.urgency || "stable") as Patient["urgency"],
                        nursesDiagnosis: (p.diagnosis || "") as string,
                        vitals: (p.vitals || "") as string,
                        prescription: { name: "", dosage: "", quantity: "" },
                        equipmentNeeded: "",
                        notesForNurse: "",
                        status: (p.status === "fulfilled" ? "Fulfilled" : "Pending") as Patient["status"],
                    })));
                }
            } catch {
                // keep demo data
            }
        };
        load();
    }, []);

    const updatePatient = (id: string, changes: Partial<Patient>) => {
        setPatients(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
    };

    const updateRx = (id: string, field: keyof Prescription, value: string) => {
        setPatients(prev => prev.map(p =>
            p.id === id ? { ...p, prescription: { ...p.prescription, [field]: value } } : p
        ));
    };

    const handleSend = async (id: string) => {
        setSending(id);
        const p = patients.find(pt => pt.id === id);
        try {
            await apiFetch("POST", "/orders", {
                site_id: SITE_ID,
                patient_tag_id: p?.tagId,
                urgency: p?.urgency,
                items: [p?.prescription],
                equipment_needed: p?.equipmentNeeded,
                notes_for_nurse: p?.notesForNurse,
            });
        } catch { /* still mark as sent in UI */ }
        setTimeout(() => {
            setSending(null);
            setSent(prev => new Set([...prev, id]));
            setPatients(prev => prev.map(pt => pt.id === id ? { ...pt, status: "Fulfilled" } : pt));
        }, 1200);
    };

    const activeCount = patients.length;

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

                {/* Header + Patient Count metric */}
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Doctor Dashboard</p>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "4px 0 10px" }}>🩺 Patient Queue</h1>
                    {/* Big metric card */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "14px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                            <p style={{ fontSize: 36, fontWeight: 900, color: C.primary, margin: 0, lineHeight: 1 }}>{activeCount}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Patient Count</p>
                        </div>
                        <div style={{ flex: 1, backgroundColor: `${C.danger}0e`, borderRadius: 12, border: `1px solid ${C.danger}33`, padding: "14px 16px", textAlign: "center" }}>
                            <p style={{ fontSize: 36, fontWeight: 900, color: C.danger, margin: 0, lineHeight: 1 }}>{patients.filter(p => p.urgency === "critical").length}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.danger, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Critical</p>
                        </div>
                        <div style={{ flex: 1, backgroundColor: `${C.success}0e`, borderRadius: 12, border: `1px solid ${C.success}33`, padding: "14px 16px", textAlign: "center" }}>
                            <p style={{ fontSize: 36, fontWeight: 900, color: C.success, margin: 0, lineHeight: 1 }}>{patients.filter(p => p.status === "Fulfilled").length}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.success, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fulfilled</p>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Sorted by AI urgency — critical first</p>
                </div>

                {/* Patient Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {patients
                        .sort((a, b) =>
                            ({ critical: 0, high: 1, moderate: 2, stable: 3 }[a.urgency]) -
                            ({ critical: 0, high: 1, moderate: 2, stable: 3 }[b.urgency])
                        )
                        .map(p => {
                            const uc = urgencyConfig(p.urgency);
                            const isExpanded = expanded === p.id;
                            const isSending = sending === p.id;
                            const isSent = sent.has(p.id);
                            return (
                                <div key={p.id} style={{
                                    backgroundColor: C.card, borderRadius: 14,
                                    border: `1px solid ${C.border}`, overflow: "hidden",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                                    borderLeft: `4px solid ${uc.color}`,
                                }}>
                                    {/* Card header — always visible */}
                                    <button
                                        onClick={() => setExpanded(isExpanded ? null : p.id)}
                                        style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                                    <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{p.tagId}</span>
                                                    <span style={{ backgroundColor: `${uc.color}18`, color: uc.color, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{uc.dot} {uc.label}</span>
                                                    <span style={{
                                                        backgroundColor: p.status === "Fulfilled" ? `${C.success}15` : `${C.warning}15`,
                                                        color: p.status === "Fulfilled" ? C.success : C.warning,
                                                        borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700
                                                    }}>{p.status}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: "left" }}>{p.vitals}</p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 13, color: C.muted, flexShrink: 0, marginLeft: 8 }}>{isExpanded ? "▲" : "▼"}</span>
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px", animation: "slideDown 0.2s ease" }}>

                                            {/* Nurse's Diagnosis */}
                                            <div style={{ marginBottom: 14, padding: "12px 14px", backgroundColor: `${C.primary}06`, borderRadius: 10, border: `1px solid ${C.primary}20` }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 6px" }}>🩺 Nurse's Diagnosis</p>
                                                <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>{p.nursesDiagnosis}</p>
                                            </div>

                                            {/* Requirements */}
                                            <div style={{ marginBottom: 14 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>💊 Requirements (Prescription)</p>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                                    {[
                                                        { label: "Name", field: "name" as keyof Prescription, placeholder: "e.g. Paracetamol" },
                                                        { label: "Dosage", field: "dosage" as keyof Prescription, placeholder: "e.g. 500mg" },
                                                        { label: "Quantity", field: "quantity" as keyof Prescription, placeholder: "e.g. 10" },
                                                    ].map(({ label, field, placeholder }) => (
                                                        <div key={field}>
                                                            <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{label}</label>
                                                            <input
                                                                style={{ ...inputStyle, fontSize: 13 }}
                                                                type="text"
                                                                placeholder={placeholder}
                                                                value={p.prescription[field]}
                                                                onChange={e => updateRx(p.id, field, e.target.value)}
                                                                onFocus={e => (e.target.style.borderColor = C.primary)}
                                                                onBlur={e => (e.target.style.borderColor = C.border)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Equipment Needed */}
                                            <div style={{ marginBottom: 12 }}>
                                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>🔧 Equipment Needed</label>
                                                <input
                                                    style={inputStyle}
                                                    type="text"
                                                    placeholder="e.g. IV drip, oxygen mask, stretcher"
                                                    value={p.equipmentNeeded}
                                                    onChange={e => updatePatient(p.id, { equipmentNeeded: e.target.value })}
                                                    onFocus={e => (e.target.style.borderColor = C.primary)}
                                                    onBlur={e => (e.target.style.borderColor = C.border)}
                                                />
                                            </div>

                                            {/* Notes for Nurse */}
                                            <div style={{ marginBottom: 14 }}>
                                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>📋 Notes for Nurse</label>
                                                <textarea
                                                    style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                                                    placeholder="Instructions, watch-outs, special notes for the nursing team..."
                                                    value={p.notesForNurse}
                                                    onChange={e => updatePatient(p.id, { notesForNurse: e.target.value })}
                                                    onFocus={e => (e.target.style.borderColor = C.primary)}
                                                    onBlur={e => (e.target.style.borderColor = C.border)}
                                                />
                                            </div>

                                            {/* SEND CTA */}
                                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={() => handleSend(p.id)}
                                                    disabled={isSending || isSent}
                                                    style={{
                                                        padding: "11px 28px",
                                                        backgroundColor: isSent ? C.success : isSending ? C.secondary : C.primary,
                                                        color: "#fff", border: "none", borderRadius: 10,
                                                        fontSize: 14, fontWeight: 700, cursor: isSent ? "default" : "pointer",
                                                        display: "flex", alignItems: "center", gap: 8,
                                                        transition: "background 0.15s",
                                                        boxShadow: isSent ? "none" : `0 3px 12px ${C.primary}44`,
                                                    }}
                                                    onMouseEnter={e => { if (!isSent && !isSending) e.currentTarget.style.backgroundColor = C.primaryHover; }}
                                                    onMouseLeave={e => { if (!isSent && !isSending) e.currentTarget.style.backgroundColor = C.primary; }}
                                                >
                                                    {isSending ? "⏳ Sending…" : isSent ? "✓ SENT" : "SEND →"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>

            <style>{`@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 700px; } }`}</style>
        </div>
    );
}
