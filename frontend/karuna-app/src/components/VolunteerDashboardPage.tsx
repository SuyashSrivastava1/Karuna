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

// ── Types ─────────────────────────────────────────────────────────────────
interface Task {
    id: string;
    description: string;
    status: "pending" | "in_progress" | "done";
    urgency: "high" | "medium" | "low";
}

interface Announcement {
    id: string;
    title: string;
    body: string;
    time: string;
    type: "info" | "warning" | "urgent";
}

interface StatCard {
    label: string;
    value: string;
    icon: string;
    color: string;
}

// ── Demo data ─────────────────────────────────────────────────────────────
const DEMO_TASKS: Task[] = [
    { id: "t1", description: "Distribute water bottles at Block C", status: "pending", urgency: "high" },
    { id: "t2", description: "Help set up medical tent at Gate 2", status: "pending", urgency: "high" },
    { id: "t3", description: "Sort donated clothes by size", status: "in_progress", urgency: "medium" },
    { id: "t4", description: "Assist with food distribution at Hall A", status: "pending", urgency: "medium" },
    { id: "t5", description: "Register new arrivals at reception desk", status: "done", urgency: "low" },
    { id: "t6", description: "Deliver blankets to families in Zone 4", status: "done", urgency: "high" },
];

const DEMO_ANNOUNCEMENTS: Announcement[] = [
    { id: "a1", title: "Water supply restored at Block B", body: "Municipal team confirms safe drinking water. Update affected families.", time: "12 min ago", type: "info" },
    { id: "a2", title: "Medical supplies arriving at 3 PM", body: "Driver en route from Central Pharmacy. Volunteers needed to unload.", time: "25 min ago", type: "warning" },
    { id: "a3", title: "Severe weather warning", body: "Thunderstorm expected between 5-8 PM. Secure all outdoor materials.", time: "1 hr ago", type: "urgent" },
];

const urgencyConfig = (u: Task["urgency"]) => ({
    high: { color: C.danger, dot: "🔴", label: "High" },
    medium: { color: C.warning, dot: "🟡", label: "Medium" },
    low: { color: C.success, dot: "🟢", label: "Low" },
}[u || "low"]);

const announcementStyle = (type: Announcement["type"]) => ({
    info: { bg: `${C.primary}08`, border: `${C.primary}30`, icon: "📢", color: C.primary },
    warning: { bg: `${C.warning}12`, border: `${C.warning}40`, icon: "⚠️", color: C.warning },
    urgent: { bg: `${C.danger}10`, border: C.danger, icon: "🚨", color: C.danger },
}[type]);

// ── Component ─────────────────────────────────────────────────────────────
export function VolunteerDashboardPage() {
    const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
    const [announcements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS);
    const [activeTab, setActiveTab] = useState<"tasks" | "announcements">("tasks");
    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState<{ track: string; reason: string } | null>(null);

    const userName = localStorage.getItem("karuna_user_name") || "Volunteer";
    const role = localStorage.getItem("karuna_role") || "volunteer";

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch("GET", "/volunteer/me");
                if (data.assigned_track) {
                    setAssignment({ track: data.assigned_track, reason: data.assignment_reason || "" });
                }
            } catch { /* use defaults */ }

            // Try loading todos from backend
            try {
                const todosData = await apiFetch("GET", `/volunteer/todos/${SITE_ID}`);
                if (Array.isArray(todosData) && todosData.length > 0) {
                    setTasks(todosData.map((t: Record<string, unknown>) => ({
                        id: t.id as string,
                        description: (t.task_description || t.description) as string,
                        status: (t.status || "pending") as Task["status"],
                        urgency: (t.urgency || "medium") as Task["urgency"],
                    })));
                }
            } catch { /* keep demo data */ }

            setLoading(false);
        };
        load();
    }, []);

    const trackLabel = assignment?.track || "HELPER";
    const trackEmoji = trackLabel === "NURSE" ? "🩺" : trackLabel === "DRIVER" ? "🚗" : "🤝";
    const trackColor = trackLabel === "NURSE" ? "#E11D48" : trackLabel === "DRIVER" ? "#0EA5E9" : C.success;

    const pendingTasks = tasks.filter(t => t.status === "pending");
    const inProgressTasks = tasks.filter(t => t.status === "in_progress");
    const doneTasks = tasks.filter(t => t.status === "done");

    const stats: StatCard[] = [
        { label: "Pending", value: String(pendingTasks.length), icon: "📋", color: C.warning },
        { label: "In Progress", value: String(inProgressTasks.length), icon: "⚡", color: C.primary },
        { label: "Completed", value: String(doneTasks.length), icon: "✅", color: C.success },
        { label: "Hours Active", value: "4.5", icon: "⏱️", color: C.accent },
    ];

    const updateTaskStatus = async (id: string, status: Task["status"]) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        try { await apiFetch("PUT", `/volunteer/todos/${id}`, { status }); } catch { /* optimistic */ }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>




            <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 56px" }}>

                {/* ── Welcome Header ── */}
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 2px", fontWeight: 500 }}>{getGreeting()},</p>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>{userName} 👋</h1>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: `${trackColor}12`, border: `1px solid ${trackColor}30`, borderRadius: 20, padding: "4px 14px" }}>
                        <span style={{ fontSize: 14 }}>{trackEmoji}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: trackColor, letterSpacing: "0.04em" }}>{trackLabel} VOLUNTEER</span>
                    </div>
                </div>

                {/* ── Stats Grid ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{
                            backgroundColor: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
                            padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            display: "flex", alignItems: "center", gap: 12,
                        }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.1 }}>{s.value}</p>
                                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>


                {/* ── Tab Switcher ── */}
                <div style={{ display: "flex", backgroundColor: "#E5E7EB", borderRadius: 10, padding: 3, marginBottom: 16 }}>
                    {(["tasks", "announcements"] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
                            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s",
                            backgroundColor: activeTab === tab ? "#ffffff" : "transparent",
                            color: activeTab === tab ? C.primary : C.muted,
                            boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                        }}>
                            {tab === "tasks" ? `📋 Tasks (${pendingTasks.length + inProgressTasks.length})` : `📢 Updates (${announcements.length})`}
                        </button>
                    ))}
                </div>

                {/* ── Tasks Tab ── */}
                {activeTab === "tasks" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {loading ? (
                            <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "40px 20px", textAlign: "center" }}>
                                <p style={{ color: C.muted, fontSize: 14 }}>Loading tasks…</p>
                            </div>
                        ) : [...pendingTasks, ...inProgressTasks].length === 0 ? (
                            <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "50px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>All caught up!</h2>
                                <p style={{ fontSize: 14, color: C.muted }}>No pending tasks. Great work, volunteer!</p>
                            </div>
                        ) : (
                            [...pendingTasks, ...inProgressTasks]
                                .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.urgency] ?? 99) - ({ high: 0, medium: 1, low: 2 }[b.urgency] ?? 99))
                                .map(task => {
                                    const uc = urgencyConfig(task.urgency);
                                    const isInProgress = task.status === "in_progress";
                                    return (
                                        <div key={task.id} style={{
                                            backgroundColor: C.card, borderRadius: 12,
                                            border: `1px solid ${C.border}`, borderLeft: `4px solid ${uc.color}`,
                                            boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden",
                                        }}>
                                            <div style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 4px", lineHeight: 1.35 }}>{task.description}</p>
                                                        <span style={{ display: "inline-block", backgroundColor: `${uc.color}15`, color: uc.color, borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                                                            {uc.dot} {uc.label}
                                                        </span>
                                                    </div>
                                                    {isInProgress && (
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: C.primary, backgroundColor: `${C.primary}12`, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>⚡ IN PROGRESS</span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    {!isInProgress && (
                                                        <button onClick={() => updateTaskStatus(task.id, "in_progress")} style={{
                                                            flex: 1, padding: "8px 0", backgroundColor: `${C.primary}10`, color: C.primary,
                                                            border: `1px solid ${C.primary}30`, borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                            cursor: "pointer", transition: "all 0.15s",
                                                        }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = "#fff"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${C.primary}10`; e.currentTarget.style.color = C.primary; }}
                                                        >
                                                            ▶ Start Task
                                                        </button>
                                                    )}
                                                    <button onClick={() => updateTaskStatus(task.id, "done")} style={{
                                                        flex: 1, padding: "8px 0", backgroundColor: isInProgress ? C.success : `${C.success}10`,
                                                        color: isInProgress ? "#fff" : C.success,
                                                        border: isInProgress ? "none" : `1px solid ${C.success}30`, borderRadius: 8, fontSize: 12, fontWeight: 700,
                                                        cursor: "pointer", transition: "all 0.15s",
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.success; e.currentTarget.style.color = "#fff"; }}
                                                        onMouseLeave={e => { if (!isInProgress) { e.currentTarget.style.backgroundColor = `${C.success}10`; e.currentTarget.style.color = C.success; } }}
                                                    >
                                                        ✓ Mark Done
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}

                        {/* Completed section */}
                        {doneTasks.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>✅ Completed ({doneTasks.length})</p>
                                {doneTasks.map(task => (
                                    <div key={task.id} style={{
                                        backgroundColor: `${C.success}06`, borderRadius: 10,
                                        border: `1px solid ${C.success}20`, padding: "10px 14px",
                                        marginBottom: 6, display: "flex", alignItems: "center", gap: 10,
                                    }}>
                                        <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                                        <p style={{ fontSize: 13, color: C.muted, margin: 0, textDecoration: "line-through" }}>{task.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Announcements Tab ── */}
                {activeTab === "announcements" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {announcements.map(ann => {
                            const as = announcementStyle(ann.type);
                            return (
                                <div key={ann.id} style={{
                                    backgroundColor: as.bg, borderRadius: 12,
                                    border: `1px solid ${as.border}`,
                                    padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 16 }}>{as.icon}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: as.color }}>{ann.title}</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: C.text, margin: "0 0 8px", lineHeight: 1.45 }}>{ann.body}</p>
                                    <p style={{ fontSize: 11, color: C.muted, margin: 0, fontWeight: 500 }}>{ann.time}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Floating Emergency Button ── */}
                <a href="tel:112" style={{
                    position: "fixed", bottom: 24, right: 24,
                    width: 56, height: 56, borderRadius: "50%",
                    backgroundColor: C.danger, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
                    textDecoration: "none", zIndex: 100,
                    transition: "transform 0.15s, box-shadow 0.15s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(239,68,68,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(239,68,68,0.4)"; }}
                >
                    🆘
                </a>
            </div>
        </div>
    );
}
