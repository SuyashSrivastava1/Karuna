import { useState, useEffect, useRef } from "react";

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", danger: "#EF4444", success: "#22C55E",
    bg: "#f9fafb", card: "#ffffff", text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const VEHICLE_ICONS: Record<string, string> = {
    car: "🚗", truck: "🚚", bike: "🏍️", van: "🚐", auto: "🛺",
};

export default function DriverActivePage() {
    const vehicleType = localStorage.getItem("karuna_vehicle") || "car";
    const vehicleIcon = VEHICLE_ICONS[vehicleType] || "🚗";

    // Simulate trip progress (0 to 100%)
    const [progress, setProgress] = useState(5);
    const [etaMinutes, setEtaMinutes] = useState(15);
    const [etaSeconds, setEtaSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 100;
                }
                return prev + 0.5;
            });
            setEtaSeconds(prev => {
                if (prev <= 0) {
                    setEtaMinutes(m => Math.max(0, m - 1));
                    return 59;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const isComplete = progress >= 100;

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#1a1a2e", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>

            {/* ── Full-Screen Map Area ── */}
            <div style={{
                flex: 1, position: "relative", overflow: "hidden",
                background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: "calc(100vh - 200px)",
            }}>
                {/* Simulated map grid lines */}
                <div style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={`h${i}`} style={{ position: "absolute", top: `${i * 5}%`, left: 0, right: 0, height: 1, background: "#fff" }} />
                    ))}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={`v${i}`} style={{ position: "absolute", left: `${i * 5}%`, top: 0, bottom: 0, width: 1, background: "#fff" }} />
                    ))}
                </div>

                {/* Simulated route line */}
                <svg viewBox="0 0 400 200" style={{ width: "80%", maxWidth: 500, position: "relative", zIndex: 2 }}>
                    <path d="M 30 170 Q 100 30 200 100 Q 300 170 370 30" fill="none" stroke="#4F46E5" strokeWidth="4" strokeDasharray="8,6" opacity="0.6" />
                    <path d="M 30 170 Q 100 30 200 100 Q 300 170 370 30" fill="none" stroke="#818cf8" strokeWidth="2" />
                    {/* Start marker */}
                    <circle cx="30" cy="170" r="8" fill={C.success} />
                    <text x="30" y="195" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">PICK</text>
                    {/* End marker */}
                    <circle cx="370" cy="30" r="8" fill={C.danger} />
                    <text x="370" y="18" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">DROP</text>
                </svg>

                {/* Map Label */}
                <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "8px 14px" }}>
                    <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, margin: 0 }}>📍 Live Route Preview</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, margin: 0 }}>Map directions loading…</p>
                </div>

                {/* Emergency Contact Button */}
                <button onClick={() => window.open("tel:112")} style={{
                    position: "absolute", top: 20, right: 20, zIndex: 10,
                    padding: "10px 18px", borderRadius: 10, border: "none",
                    background: C.danger, color: "#fff", fontSize: 13, fontWeight: 800,
                    cursor: "pointer", boxShadow: `0 4px 16px ${C.danger}66`,
                    display: "flex", alignItems: "center", gap: 6,
                }}>🆘 EMERGENCY NO.</button>
            </div>

            {/* ── Bottom Tracking Panel ── */}
            <div style={{
                background: C.card, borderTop: `1px solid ${C.border}`,
                padding: "20px 24px 28px", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
            }}>
                {/* Progress Bar Track */}
                <div style={{ position: "relative", marginBottom: 12 }}>
                    {/* Labels */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.success }}>📍 PICK</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.danger }}>🏥 DESTIN</span>
                    </div>

                    {/* Track */}
                    <div style={{
                        width: "100%", height: 6, borderRadius: 3,
                        background: C.border, position: "relative", overflow: "visible",
                    }}>
                        {/* Filled portion */}
                        <div style={{
                            width: `${progress}%`, height: "100%", borderRadius: 3,
                            background: `linear-gradient(90deg, ${C.success}, ${C.primary})`,
                            transition: "width 1s linear",
                        }} />

                        {/* Vehicle Icon (animated) */}
                        <div style={{
                            position: "absolute", top: "50%", left: `${progress}%`,
                            transform: "translate(-50%, -50%)",
                            fontSize: 28, lineHeight: 1,
                            transition: "left 1s linear",
                            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
                        }}>{vehicleIcon}</div>
                    </div>
                </div>

                {/* Live ETA */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
                    {isComplete ? (
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 24, fontWeight: 800, color: C.success, margin: 0 }}>✅ Delivered!</p>
                            <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 12px" }}>You've reached the destination</p>
                            <button onClick={() => window.location.href = "/driver"} style={{
                                padding: "10px 24px", borderRadius: 10, border: "none",
                                background: C.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                            }}>← Back to Tasks</button>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                background: `${C.primary}10`, borderRadius: 10, padding: "10px 20px",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <span style={{ fontSize: 16 }}>⏱️</span>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", margin: 0 }}>Estimated Arrival</p>
                                    <p style={{
                                        fontSize: 24, fontWeight: 900, color: C.text, margin: 0,
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {etaMinutes}:{etaSeconds.toString().padStart(2, "0")}
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                background: `${C.success}10`, borderRadius: 10, padding: "10px 20px",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <span style={{ fontSize: 16 }}>📊</span>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", margin: 0 }}>Completion</p>
                                    <p style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>{Math.round(progress)}%</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
