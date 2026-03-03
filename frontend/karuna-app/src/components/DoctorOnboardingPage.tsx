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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                {label} {required && <span style={{ color: C.danger }}>*</span>}
            </label>
            {children}
        </div>
    );
}

export function DoctorOnboardingPage() {
    const existingToken = localStorage.getItem("karuna_token") || "";
    const isLoggedIn = !!existingToken;

    // Registration fields
    const [fullName, setFullName] = useState(localStorage.getItem("karuna_user_name") || "");
    const [email, setEmail] = useState(localStorage.getItem("karuna_user_email") || "");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    // Professional fields
    const [dob, setDob] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [regNumber, setRegNumber] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            let token = existingToken;

            // Step 1: Register if not logged in
            if (!isLoggedIn) {
                if (!email || !password || password.length < 6) {
                    throw new Error("Email and password (min 6 chars) are required");
                }

                const reg = await fetch(`${API}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                        full_name: fullName.trim(),
                        phone: phone.replace(/\s/g, "") || undefined,
                        role: "doctor",
                        date_of_birth: dob || undefined,
                        blood_group: bloodGroup || undefined,
                        medical_specialty: specialty,
                        doctor_registration_number: regNumber || undefined,
                    }),
                });
                const regData = await reg.json();

                if (!reg.ok && !regData.message?.includes("already exists")) {
                    throw new Error(regData.message || "Registration failed");
                }

                // Get session
                let session = regData.session;
                if (!session) {
                    const loginRes = await fetch(`${API}/auth/login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: email.trim(), password }),
                    });
                    const loginData = await loginRes.json();
                    if (!loginRes.ok) throw new Error(loginData.message || "Login failed");
                    token = loginData.access_token || loginData.session?.access_token || "";
                    localStorage.setItem("karuna_token", token);
                    localStorage.setItem("karuna_role", loginData.user?.role || "doctor");
                    localStorage.setItem("karuna_user_name", loginData.user?.full_name || fullName);
                    localStorage.setItem("karuna_user_email", email);
                } else {
                    token = session.access_token || "";
                    localStorage.setItem("karuna_token", token);
                    localStorage.setItem("karuna_role", regData.user?.user_metadata?.role || "doctor");
                    localStorage.setItem("karuna_user_name", regData.user?.user_metadata?.full_name || fullName);
                    localStorage.setItem("karuna_user_email", email);
                }
            }

            // Step 2: Update professional details (if already logged in)
            if (isLoggedIn && token) {
                await fetch(`${API}/auth/me`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        date_of_birth: dob || undefined,
                        blood_group: bloodGroup || undefined,
                        medical_specialty: specialty,
                        doctor_registration_number: regNumber || undefined,
                    }),
                });
            }

            setDone(true);
            setTimeout(() => { window.location.href = "/doctor"; }, 1500);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally { setLoading(false); }
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, minHeight: "100vh" }}>




            <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 56px" }}>
                <div style={{ marginBottom: 20 }}>
                    <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: C.muted, fontSize: 14, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>← Back</button>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>Register as a Doctor</h1>
                    <p style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Fill in your details to join Karuna as a medical professional.</p>
                </div>

                <div style={{ backgroundColor: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Doctor Details</p>
                    </div>

                    {!done ? (
                        <form onSubmit={handleSubmit} style={{ padding: "16px 20px 20px" }}>

                            {/* Account fields — only if not logged in */}
                            {!isLoggedIn && (
                                <>
                                    <Field label="Full Name" required>
                                        <input style={inputStyle} type="text" placeholder="Dr. Full Name"
                                            value={fullName} onChange={e => setFullName(e.target.value)} required
                                            onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                                    </Field>

                                    <Field label="Email Address" required>
                                        <input style={inputStyle} type="email" placeholder="doctor@example.com"
                                            value={email} onChange={e => setEmail(e.target.value)} required
                                            onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                                    </Field>

                                    <Field label="Password" required>
                                        <input style={inputStyle} type="password" placeholder="Create a password (min 6 chars)"
                                            value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                                            onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                                    </Field>

                                    <Field label="Phone Number">
                                        <input style={inputStyle} type="tel" placeholder="+91 XXXXX XXXXX"
                                            value={phone} onChange={e => setPhone(e.target.value)}
                                            onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                                    </Field>
                                </>
                            )}

                            {/* Professional fields — always shown */}
                            <Field label="Date of Birth" required>
                                <input style={inputStyle} type="date" value={dob} onChange={e => setDob(e.target.value)} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Blood Group" required>
                                <select style={{ ...inputStyle, cursor: "pointer" }} value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)}>
                                    <option value="">Select blood group</option>
                                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                            </Field>

                            <Field label="Medical Specialty" required>
                                <input style={inputStyle} type="text" placeholder="e.g. Cardiology, General Practice"
                                    value={specialty} onChange={e => setSpecialty(e.target.value)} required
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            <Field label="Doctor Registration Number">
                                <input style={inputStyle} type="text" placeholder="e.g. MCI-12345"
                                    value={regNumber} onChange={e => setRegNumber(e.target.value)}
                                    onFocus={e => (e.target.style.borderColor = C.primary)} onBlur={e => (e.target.style.borderColor = C.border)} />
                            </Field>

                            {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</p>}

                            <button type="submit" disabled={loading} style={{
                                width: "100%", padding: "14px 0",
                                backgroundColor: loading ? C.muted : C.primary, color: "#fff",
                                border: "none", borderRadius: 12,
                                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                letterSpacing: "0.02em", transition: "background 0.15s",
                                boxShadow: `0 4px 16px ${C.primary}44`,
                            }}>
                                {loading ? "Registering…" : "Register & Continue →"}
                            </button>
                        </form>
                    ) : (
                        <div style={{ padding: "28px 24px", textAlign: "center" }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                            <p style={{ fontWeight: 700, color: C.success, fontSize: 16 }}>Registration Successful!</p>
                            <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Redirecting to Doctor Dashboard…</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
