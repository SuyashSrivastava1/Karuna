import { useState, useRef, useEffect } from "react";

// ── API ─────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

interface ChatResponse {
    response: string;
    nearest_site?: { name: string; location: string; distance_km: string } | null;
    volunteer_contact?: { name: string; phone: string; role: string } | null;
    emergency_numbers?: Record<string, string>;
    ai_error?: boolean;
}

interface Msg { id: string; from: "bot" | "user"; text: string; isTyping?: boolean; handoff?: boolean; }
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
    const [volunteerContact, setVolunteerContact] = useState<{ name: string; phone: string; role: string } | null>(null);
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

        // Keyword trigger for Volunteer Handoff
        const isHandoff = /\b(human|volunteer|help|emergency|sos)\b/i.test(text);

        try {
            const result = await callChatbot(text, history, userLocation);
            setMessages(prev => prev.filter(m => m.id !== typingId));

            if (isHandoff || result.ai_error || /\b(emergency|human|volunteer)\b/i.test(result.response)) {
                // Prepend or inject the escalation
                const id = Date.now().toString() + "handoff";
                setMessages(prev => [...prev, { id, from: "bot", text: "🚨 EMERGENCY ESCALATION INITIATED: I am connecting you to human assistance. Please click the secure link below to proceed to the live volunteer dashboard.", handoff: true }]);
            }

            appendBotMsg(result.response);
            if (result.nearest_site) setNearestSite(result.nearest_site);
            if (result.volunteer_contact) setVolunteerContact(result.volunteer_contact);
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

    // Google Maps link from user location
    const mapsUrl = userLocation
        ? `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`
        : null;

    // Google Maps link to nearest site (search by name + location)
    const nearestSiteMapsUrl = nearestSite
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearestSite.name + " " + nearestSite.location)}`
        : null;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>




            {/* Nearest site banner with Google Maps link */}
            {
                nearestSite && (
                    <div style={{ maxWidth: 600, margin: "8px auto 0", width: "100%", padding: "0 16px" }}>
                        <div style={{ backgroundColor: `${C.success}15`, border: `1px solid ${C.success}44`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>📍</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: C.success, margin: 0 }}>Nearest Safe Zone: {nearestSite.name}</p>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{nearestSite.location} — {nearestSite.distance_km} km away</p>
                            </div>
                            {nearestSiteMapsUrl && (
                                <a href={nearestSiteMapsUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: C.primary, textDecoration: "none", padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.primary}`, whiteSpace: "nowrap" }}>
                                    🗺️ Open Map
                                </a>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Volunteer contact banner */}
            {
                volunteerContact && (
                    <div style={{ maxWidth: 600, margin: "8px auto 0", width: "100%", padding: "0 16px" }}>
                        <div style={{ backgroundColor: `${C.primary}10`, border: `1px solid ${C.primary}33`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>🤝</span>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: C.primary, margin: 0 }}>Volunteer: {volunteerContact.name} ({volunteerContact.role})</p>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>📞 {volunteerContact.phone}</p>
                            </div>
                            <a href={`tel:${volunteerContact.phone}`} style={{ fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none", padding: "6px 12px", borderRadius: 6, backgroundColor: C.success, whiteSpace: "nowrap" }}>
                                📞 Call
                            </a>
                        </div>
                    </div>
                )
            }

            {/* Your location on Google Maps */}
            {
                mapsUrl && !nearestSite && (
                    <div style={{ maxWidth: 600, margin: "8px auto 0", width: "100%", padding: "0 16px" }}>
                        <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", backgroundColor: `${C.secondary}10`, border: `1px solid ${C.secondary}33`, borderRadius: 10, padding: "8px 14px" }}>
                            <span style={{ fontSize: 18 }}>🗺️</span>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.secondary, margin: 0 }}>View your shared location on Google Maps →</p>
                        </a>
                    </div>
                )
            }

            {/* ── Chat Area — messages start just above the input bar ── */}
            <div style={{ flex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "16px 16px 130px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12 }}>

                {/* Action cards - Moved to TOP of visual hierarchy */}
                {actionCardsVisible && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
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

                        {/* Connect to volunteer card — same style as emergency numbers */}
                        <a href="tel:1098" style={{ textDecoration: "none", padding: "14px 16px", backgroundColor: `${C.primary}10`, border: `1.5px solid ${C.primary}44`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.15s" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${C.primary}18`)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${C.primary}10`)}>
                            <span style={{ fontSize: 24 }}>🤝</span>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.primary, margin: 0 }}>Connect to Volunteer</p>
                                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Get connected to a nearby volunteer for help immediately</p>
                            </div>
                        </a>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                            {QUICK_CHIPS.map(chip => (
                                <button key={chip} onClick={() => sendMessage(chip)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${C.primary}`, backgroundColor: `${C.primary}10`, color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${C.primary}10`; e.currentTarget.style.color = C.primary; }}>
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat History */}
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
                                backgroundColor: msg.handoff ? `${C.danger}15` : (msg.from === "bot" ? C.card : C.primary),
                                color: msg.from === "bot" ? C.text : "#fff",
                                fontSize: 14, fontWeight: 500, lineHeight: 1.5,
                                border: msg.handoff ? `2px solid ${C.danger}` : (msg.from === "bot" ? `1px solid ${C.border}` : "none"),
                                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", whiteSpace: "pre-line",
                            }}>
                                {msg.text}
                                {msg.handoff && (
                                    <div style={{ marginTop: 12 }}>
                                        <a href="/nurse" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", backgroundColor: C.danger, color: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                                            🔗 Connect to Live Volunteer Dashboard
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
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
        </div>
    );
}
