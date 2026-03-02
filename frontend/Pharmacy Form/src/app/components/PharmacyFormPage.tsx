import { useState } from "react";

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
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
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
                    <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                        <img src="/logo.png" alt="Karuna Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                        <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>Karuna</span>
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

                        <button
                            type="submit"
                            style={{
                                width: "100%", padding: "14px 0",
                                backgroundColor: C.primary, color: "#fff",
                                border: "none", borderRadius: 12,
                                fontSize: 15, fontWeight: 700, cursor: "pointer",
                                letterSpacing: "0.02em", transition: "background 0.15s",
                                marginTop: 6,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.primary)}
                        >
                            REGISTER AND CONTINUE →
                        </button>

                        {submitted && (
                            <div style={{ marginTop: 12, padding: "10px 14px", backgroundColor: "#f0fdf4", border: `1px solid ${C.success}`, borderRadius: 8, color: "#16a34a", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
                                ✓ Registration submitted! Redirecting to dashboard…
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
