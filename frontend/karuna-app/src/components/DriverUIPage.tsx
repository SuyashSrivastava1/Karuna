import { useState, useEffect } from "react";

// API Config
const API_BASE = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("karuna_token");

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    warning: "#F59E0B", success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

interface Task {
    id: string;
    location: string;
    eta: string;
    deliverTo: string;
    priority: "urgent" | "normal";
    status: "Pending" | "Accepted" | "Fulfilled";
}

export function DriverUIPage() {
    const [isOnline, setIsOnline] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await fetch(`${API_BASE}/driver/tasks`, {
                    headers: { "Authorization": `Bearer ${getToken()}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data);
                    const active = data.find((t: Task) => t.status === "Pending" || t.status === "Accepted");
                    setActiveTask(active || null);
                }
            } catch (err) {
                console.error("Failed to fetch tasks", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const toggleStatus = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        try {
            await fetch(`${API_BASE}/driver/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                body: JSON.stringify({ status: newStatus ? "online" : "offline" })
            });
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleAccept = (task: Task) => {
        setActiveTask({ ...task, status: "Accepted" });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Accepted" } : t));
        setTimeout(() => {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(task.location)}`, "_blank");
        }, 800);
    };

    const handleComplete = (task: Task) => {
        setActiveTask(null);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "Fulfilled" } : t));
    };

    const historyTasks = tasks.filter(t => t.status === "Fulfilled");

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* Nav */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        <img src="/logo.png" alt="Karuna" style={{ height: 32, width: "auto", borderRadius: 6 }} />
                    </a>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{isOnline ? "Online" : "Offline"}</span>
                        <div
                            onClick={toggleStatus}
                            style={{
                                width: 44, height: 24, borderRadius: 12,
                                backgroundColor: isOnline ? C.success : C.border,
                                cursor: "pointer", position: "relative", transition: "background 0.2s"
                            }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff",
                                position: "absolute", top: 2, left: isOnline ? 22 : 2,
                                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                            }} />
                        </div>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 56px" }}>

                {!isOnline ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>😴</div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>You are offline</h2>
                        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Toggle your status to online to start receiving delivery tasks.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Driver Dispatch</p>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>🚗 Active Task</h1>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Loading tasks...</div>
                        ) : activeTask ? (
                            <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${activeTask.priority === "urgent" ? C.danger : C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 24 }}>
                                {activeTask.priority === "urgent" && (
                                    <div style={{ backgroundColor: `${C.danger}12`, borderBottom: `1px solid ${C.danger}33`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>🔴</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: "0.05em" }}>Urgent Delivery</span>
                                    </div>
                                )}
                                <div style={{ padding: "16px 20px" }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Pickup</p>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>{activeTask.location}</p>

                                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Dropoff</p>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 24 }}>{activeTask.deliverTo}</p>

                                    {activeTask.status === "Pending" ? (
                                        <button
                                            onClick={() => handleAccept(activeTask)}
                                            style={{ width: "100%", padding: "14px 0", backgroundColor: C.primary, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                                        >
                                            Accept Delivery →
                                        </button>
                                    ) : (
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <button
                                                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeTask.location)}`, "_blank")}
                                                style={{ flex: 1, padding: "12px 0", backgroundColor: "#f3f4f6", color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                                            >
                                                🗺️ Map
                                            </button>
                                            <button
                                                onClick={() => handleComplete(activeTask)}
                                                style={{ flex: 2, padding: "12px 0", backgroundColor: C.success, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                                            >
                                                ✓ Mark Delivered
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: C.card, borderRadius: 14, border: `1px dashed ${C.border}`, marginBottom: 24 }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>Searching for tasks</h3>
                                <p style={{ fontSize: 13, color: C.muted }}>You'll be assigned a delivery when a site requests supplies.</p>
                            </div>
                        )}

                        {/* History Log */}
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>Delivery History</h2>
                            {historyTasks.length === 0 ? (
                                <p style={{ fontSize: 13, color: C.muted }}>No completed tasks yet today.</p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {historyTasks.map(t => (
                                        <div key={t.id} style={{ backgroundColor: C.card, padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.deliverTo}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: C.success, backgroundColor: `${C.success}15`, padding: "2px 8px", borderRadius: 12 }}>✓ Done</span>
                                            </div>
                                            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>From: {t.location}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
