import { useState, useRef, useEffect } from "react";

// ── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

interface ChatResponse {
    response: string;
    nearest_site?: { name: string; location: string; distance_km: string } | null;
    emergency_numbers?: Record<string, string>;
    ai_error?: boolean;
}

interface Msg { id: string; from: "bot" | "user"; text: string; isTyping?: boolean; }
interface HistoryEntry { role: "user" | "assistant"; content: string; }

async function callChatbot(
    message: string,
    history: HistoryEntry[],
    location?: { lat: number; lng: number }
): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, location }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const QUICK_CHIPS = [
    "Show closest safe site",
    "Show emergency no.",
    "Connect me to volunteers.",
];

export function ChatbotPage() {
    const [messages, setMessages] = useState<Msg[]>([
        { id: "1", from: "bot", text: "How can I help you:" },
    ]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [locSharing, setLocSharing] = useState(false);
    const [locStatus, setLocStatus] = useState("");
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();
    const [nearestSite, setNearestSite] = useState<{ name: string; location: string; distance_km: string } | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const appendBotMsg = (text: string) => {
        const id = Date.now().toString() + "b";
        setMessages(prev => [...prev, { id, from: "bot", text }]);
        setHistory(prev => [...prev, { role: "assistant", content: text }]);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: Msg = { id: Date.now().toString(), from: "user", text };
        setMessages(prev => [...prev, userMsg]);
        const newHistory = [...history, { role: "user" as const, content: text }];
        setHistory(newHistory);
        setInput("");
        setLoading(true);

        // typing indicator
        const typingId = "typing-" + Date.now();
        setMessages(prev => [...prev, { id: typingId, from: "bot", text: "", isTyping: true }]);

        try {
            const result = await callChatbot(text, history, userLocation);
            setMessages(prev => prev.filter(m => m.id !== typingId));
            appendBotMsg(result.response);
            if (result.nearest_site) setNearestSite(result.nearest_site);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== typingId));
            appendBotMsg("⚠️ Connection error. Emergency numbers:\n• 112 (National)\n• 108 (Ambulance)\n• 1078 (NDRF)\n\nStay calm. Help is on the way.");
        } finally {
            setLoading(false);
        }
    };

    const handleShareLocation = () => {
        setLocSharing(true);
        setLocStatus("Locating you…");
        if (!navigator.geolocation) {
            setLocStatus("Location unavailable on this device.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                setLocStatus("📡 Location shared! Finding nearest safe zone…");
                await sendMessage("I've just shared my location. What's the nearest safe zone?");
                setLocStatus("✅ Done");
            },
            () => setLocStatus("⚠️ Could not get location. Please allow location access.")
        );
    };

    const actionCardsVisible = messages.filter(m => !m.isTyping).length <= 2;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

            {/* ── Header ── */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="http://localhost:5182" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
                        <img src="/logo.png" alt="Karuna" style={{ height: 32, width: "auto", borderRadius: 6 }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.success, boxShadow: `0 0 0 2px ${C.success}44`, animation: "pulse 2s infinite" }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.success }}>Online</span>
                        </div>
                    </a>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: `${C.danger}12`, borderRadius: 8, padding: "6px 12px", border: `1px solid ${C.danger}33` }}>
                        <span style={{ fontSize: 16 }}>📞</span>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 600, color: C.danger, letterSpacing: "0.06em", margin: 0 }}>EMERGENCY</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: C.danger, margin: 0 }}>112 · 108 · 1078</p>
                        </div>
                    </div>
                </div>
            </nav >

            {/* Nearest site banner */}
            {
                nearestSite && (
                    <div style={{ maxWidth: 600, margin: "8px auto 0", width: "100%", padding: "0 16px" }}>
                        <div style={{ backgroundColor: `${C.success}15`, border: `1px solid ${C.success}44`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>📍</span>
                            <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: C.success, margin: 0 }}>Nearest Safe Zone: {nearestSite.name}</p>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{nearestSite.location} — {nearestSite.distance_km} km away</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ── Chat Area ── */}
            <div style={{ flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "16px 16px 130px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                        {msg.isTyping ? (
                            <div style={{ padding: "12px 16px", borderRadius: "4px 16px 16px 16px", backgroundColor: C.card, border: `1px solid ${C.border}`, display: "flex", gap: 4, alignItems: "center" }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: C.muted, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                maxWidth: "78%", padding: "11px 15px",
                                borderRadius: msg.from === "bot" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                                backgroundColor: msg.from === "bot" ? C.card : C.primary,
                                color: msg.from === "bot" ? C.text : "#fff",
                                fontSize: 14, fontWeight: 500, lineHeight: 1.5,
                                border: msg.from === "bot" ? `1px solid ${C.border}` : "none",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", whiteSpace: "pre-line",
                            }}>{msg.text}</div>
                        )}
                    </div>
                ))}

                {/* Action cards */}
                {actionCardsVisible && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                        <button onClick={() => sendMessage("Show me all emergency numbers.")} style={{ padding: "14px 16px", backgroundColor: `${C.danger}10`, border: `1.5px solid ${C.danger}44`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.15s" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${C.danger}18`)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${C.danger}10`)}>
                            <span style={{ fontSize: 24 }}>🚨</span>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.danger, margin: 0 }}>Emergency Numbers</p>
                                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Get all emergency contact numbers instantly</p>
                            </div>
                        </button>

                        <button onClick={handleShareLocation} disabled={locSharing} style={{ padding: "14px 16px", backgroundColor: locSharing ? `${C.success}15` : C.primary, border: `1.5px solid ${locSharing ? C.success : C.primary}`, borderRadius: 12, cursor: locSharing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.2s", boxShadow: locSharing ? "none" : `0 4px 16px ${C.primary}44` }} onMouseEnter={e => { if (!locSharing) e.currentTarget.style.backgroundColor = C.primaryHover; }} onMouseLeave={e => { if (!locSharing) e.currentTarget.style.backgroundColor = C.primary; }}>
                            <span style={{ fontSize: 24 }}>📍</span>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: locSharing ? C.success : "#fff", margin: 0 }}>{locSharing ? "Location Shared ✓" : "Start Sharing Location"}</p>
                                <p style={{ fontSize: 12, color: locSharing ? C.muted : "#ffffffbb", margin: 0 }}>{locStatus || "Instantly finds your nearest safe zone via AI"}</p>
                            </div>
                        </button>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                            {QUICK_CHIPS.map(chip => (
                                <button key={chip} onClick={() => sendMessage(chip)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${C.primary}`, backgroundColor: `${C.primary}10`, color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${C.primary}10`; e.currentTarget.style.color = C.primary; }}>
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTop: `1px solid ${C.border}`, padding: "12px 16px 20px", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", gap: 10 }}>
                    <input
                        style={{ flex: 1, padding: "12px 18px", borderRadius: 28, border: `1.5px solid ${C.border}`, fontSize: 14, backgroundColor: C.bg, outline: "none", fontFamily: "'Inter', sans-serif", color: C.text, transition: "border-color 0.15s" }}
                        placeholder="Describe your situation…"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                        onFocus={e => (e.target.style.borderColor = C.primary)}
                        onBlur={e => (e.target.style.borderColor = C.border)}
                        disabled={loading}
                    />
                    <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ width: 46, height: 46, borderRadius: "50%", backgroundColor: loading || !input.trim() ? C.muted : C.accent, border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "background 0.15s", boxShadow: `0 2px 10px ${C.accent}44` }}>➤</button>
                </div>
            </div>

            <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 2px #22C55E44} 50%{box-shadow:0 0 0 5px #22C55E22} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
        </div >
    );
}
