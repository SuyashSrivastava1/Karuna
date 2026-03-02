import { useState } from "react";

const API = "http://localhost:5000/api";

const C = {
    primary: "#4F46E5", primaryHover: "#4338CA", secondary: "#6366F1",
    accent: "#F97316", accentHover: "#ea580c", danger: "#EF4444",
    success: "#22C55E", bg: "#f9fafb", card: "#ffffff",
    text: "#111827", muted: "#6B7280", border: "#E5E7EB",
};

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: `1px solid ${C.border}`, borderRadius: 10,
    fontSize: 15, color: C.text, backgroundColor: C.bg,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            {children}
        </div>
    );
}

export function PharmacyFormPage() {
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", dob: "", address: "" });
    const [step, setStep] = useState<"form" | "otp" | "done">("form");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            window.location.href = "/pharmacy";
        }, 1500);
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>

            {/* Nav bar */}
            <nav style={{ backgroundColor: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="http://localhost:5182" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        <img src="/logo.png" alt="Karuna" style={{ height: 32, width: "auto", borderRadius: 6 }} />
                    </a>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🆘 Help Me</button>
                        <button style={{ backgroundColor: C.secondary, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Donate</button>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 16px 56px" }}>
                <div style={{ marginBottom: 20 }}>
                    <button style={{ background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>← Back</button>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Registration</p>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Pharmacy Form</h1>
                    <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Register your pharmacy to start supplying relief sites.</p>
                </div>

                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Pharmacy Details</p>
                    </div>

                    {step === "form" ? (
                        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>

                            <Field label="Full Name" required>
                                <input style={inputStyle} type="text" placeholder="Pharmacy owner / contact name"
                                    value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Email Address" required>
                                <input style={inputStyle} type="email" placeholder="pharmacy@example.com"
                                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                                <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>📧 Used for OTP verification login</p>
                            </Field>

                            <Field label="Phone Number" required>
                                <input style={inputStyle} type="tel" placeholder="+91 XXXXX XXXXX"
                                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Date of Birth" required>
                                <input style={inputStyle} type="date"
                                    value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Pharmacy Address" required>
                                <textarea
                                    style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
                                    placeholder="Street, Area, City, State, PIN Code"
                                    value={form.address}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    required
                                    onFocus={e => (e.target.style.borderColor = C.primary)}
                                    onBlur={e => (e.target.style.borderColor = C.border)}
                                />
                            </Field>

                            {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%", padding: "14px 0",
                                    backgroundColor: loading ? C.muted : C.primary, color: "#fff",
                                    border: "none", borderRadius: 12,
                                    fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                    letterSpacing: "0.02em", marginTop: 6,
                                }}
                            >
                                {loading ? "Registering…" : "REGISTER AND CONTINUE →"}
                            </button>
                        </form>
                    ) : step === "otp" ? (
                        <form onSubmit={handleVerify} style={{ padding: "20px 24px 24px" }}>
                            <p style={{ fontSize: 14, color: C.muted, marginBottom: 16, textAlign: "center" }}>
                                A 6-digit OTP was sent to <strong>{form.email}</strong>
                            </p>
                            <Field label="Enter OTP" required>
                                <input style={{ ...inputStyle, textAlign: "center", fontSize: 28, fontWeight: 700, letterSpacing: "0.3em" }}
                                    type="text" placeholder="000000" maxLength={6}
                                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                                    autoFocus required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>
                            {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}
                            <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px 0", backgroundColor: loading ? C.muted : C.primary, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginBottom: 12 }}>
                                {loading ? "Verifying…" : "VERIFY & ENTER DASHBOARD →"}
                            </button>
                            <button type="button" onClick={() => setStep("form")} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, width: "100%", textDecoration: "underline" }}>← Change email</button>
                        </form>
                    ) : (
                        <div style={{ padding: "28px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                            <p style={{ fontWeight: 700, color: C.success, fontSize: 16 }}>Login Successful!</p>
                            <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Redirecting to Pharmacy Dashboard…</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
