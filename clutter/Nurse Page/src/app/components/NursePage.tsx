import { useState, useEffect } from "react";

// ── API ──────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("karuna_token");
const SITE_ID = localStorage.getItem("karuna_site_id") || "demo-site";

async function apiFetch(method: string, path: string, body?: object) {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

// ── Color tokens (matching sign-in page exactly) ──
const C = {
    primary: "#4F46E5",
    primaryHover: "#4338CA",
    secondary: "#6366F1",
    accent: "#F97316",
    accentHover: "#ea580c",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#22C55E",
    bg: "#f9fafb",
    card: "#ffffff",
    text: "#111827",
    muted: "#6B7280",
    border: "#E5E7EB",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.bg,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "'Inter', sans-serif",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    marginBottom: 6,
};

// ── Triage config ──
const TRIAGE = [
    { id: "urgent", label: "Urgent", color: C.danger, dot: "🔴" },
    { id: "moderate", label: "Moderate", color: C.warning, dot: "🟡" },
    { id: "stable", label: "Stable", color: C.success, dot: "🟢" },
];

// ── Types ──
interface Patient {
    id: string;
    tagId: string;
    tag_id?: string;
    triage: string;
    triage_level?: string;
    diagnosis: string;
    vitals: string;
    notes: string;
    nurse_notes?: string;
}

interface TodoItem {
    id: string;
    text: string;
    task_description?: string;
    patientTag: string;
    patient_tag?: string;
    done: boolean;
    status: "Pending" | "In Progress" | "Done";
}

const normalizePatient = (p: Record<string, unknown>): Patient => ({
    id: p.id as string,
    tagId: (p.tag_id || p.tagId) as string,
    triage: (p.triage_level || p.triage) as string,
    diagnosis: p.diagnosis as string,
    vitals: (p.vitals || "") as string,
    notes: (p.nurse_notes || p.notes || "") as string,
});

const normalizeTodo = (t: Record<string, unknown>): TodoItem => ({
    id: t.id as string,
    text: (t.task_description || t.text) as string,
    patientTag: (t.patient_tag || t.patientTag || "") as string,
    done: t.status === "done" || t.done === true,
    status: t.status === "done" ? "Done" : t.status === "in_progress" ? "In Progress" : "Pending",
});

export function NursePage() {
    // ── Patient Intake state ──
    const [intakeOpen, setIntakeOpen] = useState(false);
    const [triage, setTriage] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [vitals, setVitals] = useState("");
    const [nurseNotes, setNurseNotes] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [nextTagId, setNextTagId] = useState("TAG-001");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    // ── Todo state ──
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTask, setNewTask] = useState("");
    const [newTaskPatient, setNewTaskPatient] = useState("");

    const triageConfig = (id: string) => TRIAGE.find(t => t.id === id) ?? TRIAGE[2];

    // ── Fetch patients and todos on mount ──
    useEffect(() => {
        const load = async () => {
            try {
                const [patientsData, todosData, nextIdData] = await Promise.allSettled([
                    apiFetch("GET", `/patients/${SITE_ID}`),
                    apiFetch("GET", `/volunteer-todos/${SITE_ID}`),
                    apiFetch("GET", `/patients/${SITE_ID}/next-id`),
                ]);
                if (patientsData.status === "fulfilled" && Array.isArray(patientsData.value)) {
                    setPatients(patientsData.value.map(normalizePatient));
                } else {
                    // Fallback demo data
                    setPatients([
                        { id: "p1", tagId: "TAG-001", triage: "urgent", diagnosis: "Dehydration, fever", vitals: "HR:105, BP:90/60", notes: "Needs IV drip immediately" },
                        { id: "p2", tagId: "TAG-002", triage: "moderate", diagnosis: "Minor fracture left arm", vitals: "HR:88, BP:115/75", notes: "Splint applied" },
                    ]);
                }
                if (todosData.status === "fulfilled" && Array.isArray(todosData.value)) {
                    setTodos(todosData.value.map(normalizeTodo));
                } else {
                    setTodos([
                        { id: "t1", text: "Administer ORS to TAG-001", patientTag: "TAG-001", done: false, status: "Pending" },
                    ]);
                }
                if (nextIdData.status === "fulfilled" && nextIdData.value?.tag_id) {
                    setNextTagId(nextIdData.value.tag_id);
                }
            } catch (e) {
                console.warn("Load failed, using demo data", e);
            }
        };
        load();
    }, []);

    const handleRegisterPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!triage || !diagnosis) return;
        setRegisterLoading(true);
        try {
            const created = await apiFetch("POST", "/patients", {
                site_id: SITE_ID,
                triage_level: triage,
                diagnosis,
                vitals,
                nurse_notes: nurseNotes,
            });
            setPatients(prev => [normalizePatient(created), ...prev]);
            // Refresh next tag ID
            const nextIdData = await apiFetch("GET", `/patients/${SITE_ID}/next-id`).catch(() => null);
            if (nextIdData?.tag_id) setNextTagId(nextIdData.tag_id);
        } catch {
            // Optimistic local add as fallback
            setPatients(prev => [{ id: `p${Date.now()}`, tagId: nextTagId, triage, diagnosis, vitals, notes: nurseNotes }, ...prev]);
        } finally {
            setDiagnosis(""); setVitals(""); setNurseNotes(""); setTriage("");
            setIntakeOpen(false);
            setRegisterLoading(false);
            setRegisterSuccess(true);
            setTimeout(() => setRegisterSuccess(false), 3000);
        }
    };

    const handleAddTodo = async () => {
        if (!newTask.trim()) return;
        try {
            const created = await apiFetch("POST", "/volunteer-todos", {
                site_id: SITE_ID,
                task_description: newTask.trim(),
                patient_tag: newTaskPatient || null,
                status: "pending",
            });
            setTodos(prev => [...prev, normalizeTodo(created)]);
        } catch {
            setTodos(prev => [...prev, { id: `t${Date.now()}`, text: newTask.trim(), patientTag: newTaskPatient, done: false, status: "Pending" }]);
        }
        setNewTask(""); setNewTaskPatient("");
    };

    const toggleTodo = async (id: string) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        const newStatus = todo.done ? "pending" : "done";
        setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done, status: t.done ? "Pending" : "Done" } : t));
        try { await apiFetch("PUT", `/volunteer-todos/${id}`, { status: newStatus }); } catch { /* keep optimistic */ }
    };

    const deleteTodo = async (id: string) => {
        setTodos(prev => prev.filter(t => t.id !== id));
        try { await apiFetch("DELETE", `/volunteer-todos/${id}`); } catch { /* already removed from UI */ }
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* ── Navbar ── */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="http://localhost:5182" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        <img src="/logo.png" alt="Karuna" style={{ height: 32, width: "auto", borderRadius: 6 }} />
                    </a>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button style={{ backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.accentHover)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.accent)}
                        >🆘 Help Me</button>
                        <button style={{ backgroundColor: C.secondary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primary)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.secondary)}
                        >Donate</button>
                    </div>
                </div>
            </nav>

            {/* ── Page Content ── */}
            <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 100px" }}>

                {/* Back + Header */}
                <div style={{ marginBottom: 20 }}>
                    <button style={{ background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}
                        onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
                        onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
                    >← Back to Dashboard</button>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>General Hospital Camp · Nurse Workspace</p>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>🏥 Nurse Dashboard</h1>
                </div>

                {/* ── Success Toast ── */}
                {registerSuccess && (
                    <div style={{ padding: "10px 14px", backgroundColor: "#f0fdf4", border: `1px solid ${C.success}`, borderRadius: 8, color: "#16a34a", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                        ✓ Patient registered successfully!
                    </div>
                )}

                {/* ══════════════════════════════════════ */}
                {/* SECTION A — PATIENT INTAKE            */}
                {/* ══════════════════════════════════════ */}
                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16, overflow: "hidden" }}>

                    {/* Section Header */}
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Section A</p>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Patient Intake</h2>
                        </div>
                        <span style={{ backgroundColor: `${C.primary}18`, color: C.primary, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                            {patients.length} patients
                        </span>
                    </div>

                    <div style={{ padding: "16px 20px" }}>

                        {/* [+ Register New Patient] Accordion Toggle */}
                        <button
                            onClick={() => setIntakeOpen(o => !o)}
                            style={{
                                width: "100%",
                                padding: "11px 16px",
                                backgroundColor: intakeOpen ? C.primary : `${C.primary}12`,
                                color: intakeOpen ? "#fff" : C.primary,
                                border: `1.5px solid ${C.primary}`,
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                transition: "all 0.2s",
                                marginBottom: intakeOpen ? 16 : 0,
                            }}
                        >
                            <span>+ Register New Patient</span>
                            <span style={{ transition: "transform 0.2s", transform: intakeOpen ? "rotate(180deg)" : "rotate(0deg)", fontSize: 12 }}>▼</span>
                        </button>

                        {/* ── Expandable Intake Form ── */}
                        {intakeOpen && (
                            <form onSubmit={handleRegisterPatient} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, animation: "slideDown 0.2s ease" }}>

                                {/* Auto-generated Tag ID */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Patient Tag ID</label>
                                    <div style={{ ...inputStyle, backgroundColor: "#f3f4f6", color: C.muted, cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>🏷️</span>
                                        <span style={{ fontWeight: 700, color: C.primary }}>{nextTagId}</span>
                                        <span style={{ fontSize: 12, color: C.muted }}>(auto-generated)</span>
                                    </div>
                                </div>

                                {/* Triage Level Chips */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Triage Level <span style={{ color: C.danger }}>*</span></label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {TRIAGE.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setTriage(t.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: "9px 6px",
                                                    borderRadius: 8,
                                                    border: `1.5px solid ${triage === t.id ? t.color : C.border}`,
                                                    backgroundColor: triage === t.id ? `${t.color}18` : C.bg,
                                                    color: triage === t.id ? t.color : C.text,
                                                    fontSize: 13,
                                                    fontWeight: triage === t.id ? 700 : 500,
                                                    cursor: "pointer",
                                                    transition: "all 0.15s",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 5,
                                                }}
                                            >
                                                {t.dot} {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Diagnosis */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Diagnosis <span style={{ color: C.danger }}>*</span></label>
                                    <input
                                        style={inputStyle}
                                        type="text"
                                        placeholder="e.g. Dehydration, minor fracture"
                                        value={diagnosis}
                                        onChange={e => setDiagnosis(e.target.value)}
                                        required
                                        onFocus={e => (e.target.style.borderColor = C.primary)}
                                        onBlur={e => (e.target.style.borderColor = C.border)}
                                    />
                                </div>

                                {/* Vitals */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={labelStyle}>Vitals <span style={{ color: C.muted, fontWeight: 400, textTransform: "none", fontSize: 11 }}>(optional)</span></label>
                                    <input
                                        style={inputStyle}
                                        type="text"
                                        placeholder="HR: 90, BP: 120/80, Temp: 37°C"
                                        value={vitals}
                                        onChange={e => setVitals(e.target.value)}
                                        onFocus={e => (e.target.style.borderColor = C.primary)}
                                        onBlur={e => (e.target.style.borderColor = C.border)}
                                    />
                                </div>

                                {/* Nurse Notes */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={labelStyle}>Nurse Notes <span style={{ color: C.muted, fontWeight: 400, textTransform: "none", fontSize: 11 }}>(optional)</span></label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                                        placeholder="Additional observations, instructions for next shift..."
                                        value={nurseNotes}
                                        onChange={e => setNurseNotes(e.target.value)}
                                        onFocus={e => (e.target.style.borderColor = C.primary)}
                                        onBlur={e => (e.target.style.borderColor = C.border)}
                                    />
                                </div>

                                {/* Register CTA */}
                                <button
                                    type="submit"
                                    style={{
                                        width: "100%",
                                        padding: "12px 0",
                                        backgroundColor: C.primary,
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 10,
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.primary)}
                                >
                                    Register Patient →
                                </button>
                            </form>
                        )}

                        {/* ── Existing Patient List ── */}
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Registered Patients</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {patients.map(p => {
                                    const tc = triageConfig(p.triage);
                                    const isEditing = editingId === p.id;
                                    return (
                                        <div
                                            key={p.id}
                                            style={{
                                                padding: "12px 14px",
                                                borderRadius: 10,
                                                border: `1px solid ${C.border}`,
                                                backgroundColor: C.bg,
                                                borderLeft: `3px solid ${tc.color}`,
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{p.tagId}</span>
                                                    <span style={{ backgroundColor: `${tc.color}18`, color: tc.color, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{tc.dot} {tc.label}</span>
                                                </div>
                                                <button
                                                    onClick={() => setEditingId(isEditing ? null : p.id)}
                                                    style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 12, color: C.muted, cursor: "pointer", fontWeight: 600 }}
                                                >{isEditing ? "Close" : "Edit"}</button>
                                            </div>
                                            <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{p.diagnosis}</p>
                                            {p.vitals && <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0", fontStyle: "italic" }}>{p.vitals}</p>}
                                            {isEditing && p.notes && (
                                                <p style={{ fontSize: 12, color: C.muted, marginTop: 6, padding: "6px 10px", backgroundColor: "#f3f4f6", borderRadius: 6 }}>
                                                    📋 {p.notes}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════ */}
                {/* SECTION B — TODO LIST                 */}
                {/* ══════════════════════════════════════ */}
                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>

                    {/* Header */}
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Section B</p>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>To Do List</h2>
                        </div>
                        <span style={{ backgroundColor: `${C.warning}22`, color: C.warning, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                            {todos.filter(t => !t.done).length} pending
                        </span>
                    </div>

                    <div style={{ padding: "16px 20px" }}>

                        {/* Add Task Row */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <input
                                style={{ ...inputStyle, flex: 1 }}
                                type="text"
                                placeholder="Add a task for a patient..."
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddTodo()}
                                onFocus={e => (e.target.style.borderColor = C.primary)}
                                onBlur={e => (e.target.style.borderColor = C.border)}
                            />
                            <button
                                onClick={handleAddTodo}
                                style={{ padding: "9px 14px", backgroundColor: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.primary)}
                            >+ Add</button>
                        </div>

                        {/* Link to patient */}
                        <select
                            style={{ ...inputStyle, marginBottom: 16, fontSize: 13 }}
                            value={newTaskPatient}
                            onChange={e => setNewTaskPatient(e.target.value)}
                            onFocus={e => (e.target.style.borderColor = C.primary)}
                            onBlur={e => (e.target.style.borderColor = C.border)}
                        >
                            <option value="">Link to patient (optional)</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.tagId}>{p.tagId} — {p.diagnosis.substring(0, 30)}</option>
                            ))}
                        </select>

                        {/* Todo Items */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {todos.length === 0 && (
                                <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "16px 0" }}>No tasks yet. Add one above.</p>
                            )}
                            {todos.map(todo => (
                                <div
                                    key={todo.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        border: `1px solid ${C.border}`,
                                        backgroundColor: todo.done ? "#f9fafb" : C.card,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        style={{
                                            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                            border: `2px solid ${todo.done ? C.success : C.border}`,
                                            backgroundColor: todo.done ? C.success : "transparent",
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.15s", marginTop: 1,
                                        }}
                                    >
                                        {todo.done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                                    </button>

                                    {/* Task content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{
                                            fontSize: 14, color: todo.done ? C.muted : C.text,
                                            textDecoration: todo.done ? "line-through" : "none",
                                            fontWeight: 500, display: "block",
                                        }}>{todo.text}</span>
                                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                            {todo.patientTag && (
                                                <span style={{ backgroundColor: `${C.primary}18`, color: C.primary, borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                                                    {todo.patientTag}
                                                </span>
                                            )}
                                            <span style={{
                                                borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                                                backgroundColor: todo.status === "Done" ? `${C.success}18` : todo.status === "In Progress" ? `${C.warning}18` : `${C.border}`,
                                                color: todo.status === "Done" ? C.success : todo.status === "In Progress" ? C.warning : C.muted,
                                            }}>
                                                {todo.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 15, padding: "0 2px", transition: "color 0.15s", flexShrink: 0 }}
                                        onMouseEnter={e => (e.currentTarget.style.color = C.danger)}
                                        onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
                                        title="Delete task"
                                    >🗑</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Floating CALL Button ── */}
            <div style={{ position: "fixed", bottom: 24, right: 16, left: 16, maxWidth: 448, margin: "0 auto", zIndex: 40 }}>
                <button
                    style={{
                        width: "100%",
                        padding: "14px 0",
                        backgroundColor: C.success,
                        color: "#fff",
                        border: "none",
                        borderRadius: 14,
                        fontSize: 16,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        boxShadow: `0 4px 20px ${C.success}55`,
                        letterSpacing: "0.01em",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#16a34a"; e.currentTarget.style.boxShadow = `0 6px 24px ${C.success}77`; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.success; e.currentTarget.style.boxShadow = `0 4px 20px ${C.success}55`; }}
                >
                    📞 CALL Support Staff
                </button>
            </div>

            <style>{`
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
