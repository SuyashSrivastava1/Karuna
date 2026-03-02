import { useState } from "react";

const API = "http://localhost:5000/api";

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: `1px solid ${C.border}`, borderRadius: 10,
    fontSize: 15, color: C.text, backgroundColor: C.bg,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s",
};

const readOnlyStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: "#f3f4f6",
    color: C.muted,
    cursor: "not-allowed",
    border: `1px solid ${C.border}`,
};

export function DoctorOnboardingPage() {
    const [dob, setDob] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // Read verified info from localStorage (set during login)
    const verifiedName = localStorage.getItem("karuna_user_name") || "";
    const verifiedEmail = localStorage.getItem("karuna_user_email") || "";
    const verifiedPhone = localStorage.getItem("karuna_user_phone") || "";
    const token = localStorage.getItem("karuna_token") || "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API}/auth/me`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    date_of_birth: dob || undefined,
                    blood_group: bloodGroup || undefined,
                    medical_specialty: specialty,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save profile");
            setDone(true);
            setTimeout(() => { window.location.href = "http://localhost:5181"; }, 2000);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally { setLoading(false); }
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* Nav */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        <img src="/logo.png" alt="Karuna" style={{ height: 32, width: "auto", borderRadius: 6 }} />
                    </a>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>Setup</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Doctor Profile Setup</p>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 56px" }}>

                {/* ── Section 1: Verified / Read-only ── */}
                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, backgroundColor: `${C.success}08` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.success, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                            ✅ Section 1 — Verified Credentials
                        </p>
                        <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Auto-filled from your registration. Cannot be edited.</p>
                    </div>
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Full Name verified */}
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Full Name</label>
                            <div style={{ ...readOnlyStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>{verifiedName}</span>
                                <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>✓ Verified</span>
                            </div>
                        </div>

                        {/* Email verified */}
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Email Address</label>
                            <div style={{ ...readOnlyStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>📧 {verifiedEmail}</span>
                                <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>✓ Verified</span>
                            </div>
                        </div>

                        {/* Phone — read-only with lock */}
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Phone Number</label>
                            <div style={{ ...readOnlyStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span>🔒 {verifiedPhone}</span>
                                <span style={{ fontSize: 11, color: C.muted }}>Secured</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 2: Professional Details (User Input) ── */}
                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Section 2 — Professional Details</p>
                        <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>Please fill in your professional information.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: "16px 20px 20px" }}>

                        {/* DOB with calendar icon */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                                Date of Birth <span style={{ color: C.danger }}>*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    style={{ ...inputStyle, paddingRight: 44 }}
                                    type="date"
                                    value={dob}
                                    onChange={e => setDob(e.target.value)}
                                    required
                                    onFocus={e => (e.target.style.borderColor = C.primary)}
                                    onBlur={e => (e.target.style.borderColor = C.border)}
                                />
                                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>📅</span>
                            </div>
                        </div>

                        {/* Blood Group dropdown with chevron */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                                Blood Group <span style={{ color: C.danger }}>*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <select
                                    style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: 40 }}
                                    value={bloodGroup}
                                    onChange={e => setBloodGroup(e.target.value)}
                                    required
                                    onFocus={e => (e.target.style.borderColor = C.primary)}
                                    onBlur={e => (e.target.style.borderColor = C.border)}
                                >
                                    <option value="">Select blood group</option>
                                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", color: C.muted }}>▼</span>
                            </div>
                        </div>

                        {/* Medical Specialty */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                                Medical Specialty <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                style={inputStyle}
                                type="text"
                                placeholder="e.g. Cardiology, General Practice"
                                value={specialty}
                                onChange={e => setSpecialty(e.target.value)}
                                required
                                onFocus={e => (e.target.style.borderColor = C.primary)}
                                onBlur={e => (e.target.style.borderColor = C.border)}
                            />
                        </div>

                        {/* CTA */}
                        {done ? (
                            <div style={{ padding: "16px", backgroundColor: "#f0fdf4", border: `1px solid ${C.success}`, borderRadius: 8, color: "#16a34a", fontSize: 14, fontWeight: 500, textAlign: "center" }}>
                                ✅ Profile saved! Redirecting to Doctor Dashboard…
                            </div>
                        ) : (
                            <>
                                {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: "100%", padding: "14px 0",
                                        backgroundColor: loading ? C.muted : C.primary, color: "#fff",
                                        border: "none", borderRadius: 12,
                                        fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                        letterSpacing: "0.02em", transition: "background 0.15s",
                                        boxShadow: `0 4px 16px ${C.primary}44`,
                                    }}
                                >
                                    {loading ? "Saving…" : "Save Profile & Continue →"}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
