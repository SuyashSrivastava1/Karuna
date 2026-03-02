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

interface Order {
    id: string;
    patientId: string;
    urgency: "urgent" | "moderate" | "stable";
    requirements: string[];
    driverName: string;
    driverPhone: string;
    eta: string;
    status: "Pending" | "Ready for Pickup" | "Ongoing" | "Delivered";
    archived: boolean;
}

const INITIAL_ORDERS: Order[] = [
    {
        id: "o1", patientId: "TAG-001", urgency: "urgent",
        requirements: ["Insulin x2", "Saline 500ml x3", "Paracetamol x10"],
        driverName: "Rajesh Kumar", driverPhone: "+91 99887 76655", eta: "8 mins",
        status: "Ready for Pickup", archived: false,
    },
    {
        id: "o2", patientId: "TAG-003", urgency: "moderate",
        requirements: ["Bandages x5", "Antiseptic 500ml", "Amoxicillin 500mg x20"],
        driverName: "Suresh Patel", driverPhone: "+91 98123 45678", eta: "15 mins",
        status: "Ongoing", archived: false,
    },
    {
        id: "o3", patientId: "TAG-007", urgency: "stable",
        requirements: ["ORS Sachets x10", "Vitamin C x30"],
        driverName: "Awaiting assignment", driverPhone: "—", eta: "—",
        status: "Pending", archived: false,
    },
];

const urgencyConfig = (u: Order["urgency"]) => ({
    urgent: { color: C.danger, dot: "🔴", label: "Urgent" },
    moderate: { color: C.warning, dot: "🟡", label: "Moderate" },
    stable: { color: C.success, dot: "🟢", label: "Stable" },
}[u || "stable"]);

const statusColor = (s: Order["status"]) => ({
    "Pending": { bg: "#f3f4f6", text: C.muted },
    "Ready for Pickup": { bg: `${C.warning}22`, text: C.warning },
    "Ongoing": { bg: `${C.primary}15`, text: C.primary },
    "Delivered": { bg: `${C.success}15`, text: C.success },
}[s]);

export function PharmacyDashboardPage() {
    const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showEmpty, setShowEmpty] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch("GET", `/orders/${SITE_ID}`);
                if (Array.isArray(data) && data.length > 0) {
                    setOrders(data.map((o: Record<string, unknown>) => ({
                        id: o.id as string,
                        patientId: (o.patient_tag_id || o.patientId) as string,
                        urgency: (o.urgency?.toString().toLowerCase() || "moderate") as Order["urgency"],
                        requirements: Array.isArray(o.items)
                            ? (o.items as { name: string; quantity: string }[]).map(i => `${i.name} x${i.quantity}`)
                            : [],
                        driverName: (o.driver_name || "Awaiting assignment") as string,
                        driverPhone: (o.driver_phone || "—") as string,
                        eta: (o.eta || "—") as string,
                        status: (o.status || "Pending") as Order["status"],
                        archived: o.status === "delivered",
                    })));
                }
            } catch {
                // keep demo data
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const activeOrders = orders.filter(o => !o.archived);

    const archiveOrder = async (id: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, archived: true, status: "Delivered" } : o));
        if (expanded === id) setExpanded(null);
        try { await apiFetch("PUT", `/orders/${id}`, { status: "delivered" }); } catch { /* optimistic */ }
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* Nav */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        <img src="/logo.png" alt="Karuna" style={{ height: 32, width: "auto", borderRadius: 6 }} />
                    </a>
                    <div style={{ display: "flex", gap: 8 }}>
                        <a href="tel:112" style={{ textDecoration: "none", backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🆘 Help Me</a>
                        <button onClick={() => window.location.href = '/donate'} style={{ backgroundColor: C.secondary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Donate</button>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 56px" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Pharmacy Dashboard</p>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "2px 0" }}>💊 Order Queue</h1>
                        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Sorted by descending urgency</p>
                    </div>
                    <span style={{ backgroundColor: `${C.primary}15`, color: C.primary, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {activeOrders.length} active
                    </span>
                </div>

                {/* Demo toggle */}
                <button
                    onClick={() => setShowEmpty(e => !e)}
                    style={{ marginBottom: 16, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, color: C.muted, cursor: "pointer" }}
                >
                    {showEmpty ? "Show Active Orders" : "Preview Empty State"}
                </button>

                {/* EMPTY STATE */}
                {(showEmpty || activeOrders.length === 0) ? (
                    <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: "60px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>No pending orders</h2>
                        <p style={{ fontSize: 14, color: C.muted }}>All orders have been fulfilled or there are no active requests at this time.</p>
                    </div>
                ) : (
                    /* ORDER CARDS */
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {activeOrders
                            .sort((a, b) => ({ urgent: 0, moderate: 1, stable: 2 }[a.urgency] ?? 99) - ({ urgent: 0, moderate: 1, stable: 2 }[b.urgency] ?? 99))
                            .map(order => {
                                const uc = urgencyConfig(order.urgency);
                                const sc = statusColor(order.status);
                                const isExpanded = expanded === order.id;
                                return (
                                    <div key={order.id} style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", borderLeft: `4px solid ${uc.color}` }}>

                                        {/* Card Header */}
                                        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                                                        <span style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{order.patientId}</span>
                                                        <span style={{ backgroundColor: `${uc.color}18`, color: uc.color, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{uc.dot} {uc.label}</span>
                                                    </div>
                                                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{order.requirements.length} item{order.requirements.length > 1 ? "s" : ""} required</p>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ backgroundColor: sc.bg, color: sc.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{order.status}</span>
                                                <button
                                                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                                                    style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 13, color: C.muted, transition: "all 0.15s", fontWeight: 600 }}
                                                >{isExpanded ? "▲" : "▼"}</button>
                                            </div>
                                        </div>

                                        {/* Requirements list */}
                                        <div style={{ padding: "0 16px 12px" }}>
                                            {order.requirements.map((req, i) => (
                                                <span key={i} style={{ display: "inline-block", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 500, color: C.text, marginRight: 6, marginBottom: 4 }}>{req}</span>
                                            ))}
                                        </div>

                                        {/* Expanded dispatch details */}
                                        {isExpanded && (
                                            <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 16px", backgroundColor: `${C.primary}04`, animation: "slideDown 0.2s ease" }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Driver Dispatch Details</p>

                                                {/* Live status */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", backgroundColor: sc.bg, borderRadius: 8 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: sc.text, flexShrink: 0 }} />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: sc.text }}>Status: {order.status}</span>
                                                </div>

                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                                                    <div style={{ backgroundColor: C.bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                                                        <p style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 3px" }}>Driver</p>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{order.driverName}</p>
                                                        <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>{order.driverPhone}</p>
                                                    </div>
                                                    <div style={{ backgroundColor: C.bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                                                        <p style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 3px" }}>ETA</p>
                                                        <p style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{order.eta}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => archiveOrder(order.id)}
                                                    style={{ width: "100%", padding: "10px 0", backgroundColor: C.success, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
                                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#16a34a")}
                                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.success)}
                                                >
                                                    ✓ Mark as Delivered & Archive
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
            <style>{`@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }`}</style>
        </div>
    );
}
