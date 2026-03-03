import { useState } from "react";
import { useNavigate } from "react-router-dom";

declare var process: any;

const API = "http://localhost:5000/api";

type AuthMode = "login" | "signup";
type Role = "volunteer" | "doctor" | "pharmacy";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// Color scheme constants
const COLORS = {
  primary: "#4F46E5", // Electric Indigo
  primaryHover: "#4338CA", // Darker Indigo for hover states
  secondary: "#6366F1", // Muted Indigo
  accent: "#F97316", // Bright Orange
  accentHover: "#ea580c", // Darker Orange for hover states
};

interface VolunteerForm {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  bloodGroup: string;
  profession: string;
  availability: string;
}

interface DoctorForm {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  bloodGroup: string;
  specialty: string;
  doctorRegistrationNumber: string;
}

interface PharmacyForm {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  pharmacyRegistrationNumber: string;
}

export function SignupPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [role, setRole] = useState<Role>("volunteer");

  const [volunteerForm, setVolunteerForm] = useState<VolunteerForm>({
    fullName: "", email: "", phone: "", dob: "", bloodGroup: "", profession: "", availability: "",
  });
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    fullName: "", email: "", phone: "", dob: "", bloodGroup: "", specialty: "", doctorRegistrationNumber: "",
  });
  const [pharmacyForm, setPharmacyForm] = useState<PharmacyForm>({
    fullName: "", email: "", phone: "", dob: "", address: "", pharmacyRegistrationNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  // Get the active form's constructed payload
  const getFormData = () => {
    let payload = { role, password };
    if (role === "volunteer") {
      return { ...payload, email: volunteerForm.email, full_name: volunteerForm.fullName, phone: volunteerForm.phone, date_of_birth: volunteerForm.dob, blood_group: volunteerForm.bloodGroup, profession: volunteerForm.profession, volunteer_availability: volunteerForm.availability };
    }
    if (role === "doctor") {
      return { ...payload, email: doctorForm.email, full_name: doctorForm.fullName, phone: doctorForm.phone, date_of_birth: doctorForm.dob, blood_group: doctorForm.bloodGroup, medical_specialty: doctorForm.specialty, doctor_registration_number: doctorForm.doctorRegistrationNumber };
    }
    return { ...payload, email: pharmacyForm.email, full_name: pharmacyForm.fullName, phone: pharmacyForm.phone, date_of_birth: pharmacyForm.dob, pharmacy_address: pharmacyForm.address, pharmacy_registration_number: pharmacyForm.pharmacyRegistrationNumber };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = getFormData();
    if (!payload.email) { setError("Email is required"); return; }
    if (!payload.password || payload.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      // 1. Register (auto-confirmed, no OTP)
      const regRes = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const regData = await regRes.json();

      // If already exists, try logging in
      let session = regData.session;
      let userData = regData.user;
      if (!regRes.ok && !regData.message?.includes("already exists")) {
        throw new Error(regData.message || "Registration failed");
      }

      if (!session) {
        // 2. Login with password
        const loginRes = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: payload.email, password: payload.password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message || "Login failed");
        session = loginData.session;
        userData = loginData.user;
        localStorage.setItem("karuna_token", loginData.access_token || session?.access_token || "");
      } else {
        localStorage.setItem("karuna_token", session.access_token || "");
      }

      // Store auth
      localStorage.setItem("karuna_role", userData?.role || userData?.user_metadata?.role || role);
      localStorage.setItem("karuna_user_name", userData?.full_name || userData?.user_metadata?.full_name || "");
      localStorage.setItem("karuna_user_email", payload.email);

      // Navigate to role page
      const r = userData?.role || userData?.user_metadata?.role || role;
      if (r === "doctor") navigate("/doctor");
      else if (r === "pharmacy") navigate("/pharmacy");
      else navigate("/volunteer/join");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <div
      style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" }}
    >
      {/* ── Persistent Navbar ── */}
      <nav
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "0 16px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
          >
            <img
              src="/logo.png"
              alt="Karuna Logo"
              style={{
                height: 36,
                width: "auto",
              }}
            />
          </a>

          {/* Right buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="tel:112"
              style={{
                textDecoration: "none",
                backgroundColor: COLORS.accent,
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.accent)
              }
            >
              🆘 Help Me
            </a>
            <button
              onClick={() => window.location.href = '/donate'}
              style={{
                backgroundColor: COLORS.secondary,
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.primary)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.secondary)
              }
            >
              Donate
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "32px 16px 48px",
        }}
      >
        {/* ── Login / Signup Tab Toggle ── */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#E5E7EB",
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(["login", "signup"] as AuthMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAuthMode(mode)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.18s",
                backgroundColor: authMode === mode ? "#ffffff" : "transparent",
                color: authMode === mode ? COLORS.primary : "#6B7280",
                boxShadow:
                  authMode === mode ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              }}
            >
              {mode === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* ── Card ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 14,
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {authMode === "signup" ? (
            <>
              {/* Card Header */}
              <div
                style={{
                  padding: "20px 24px 0",
                  borderBottom: "1px solid #E5E7EB",
                  paddingBottom: 0,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6B7280",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Create Account
                </p>

                {/* ── Role Selector Tabs ── */}
                <div
                  style={{
                    display: "flex",
                    gap: 0,
                    borderBottom: "none",
                  }}
                >
                  {(
                    [
                      { key: "volunteer", label: "Volunteer" },
                      { key: "doctor", label: "Doctor" },
                      { key: "pharmacy", label: "Pharmacy" },
                    ] as { key: Role; label: string }[]
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setRole(key)}
                      style={{
                        flex: 1,
                        padding: "9px 4px",
                        border: "none",
                        borderBottom:
                          role === key
                            ? `2px solid ${COLORS.primary}`
                            : "2px solid transparent",
                        backgroundColor: "transparent",
                        fontSize: 13,
                        fontWeight: role === key ? 700 : 500,
                        color: role === key ? COLORS.primary : "#6B7280",
                        cursor: "pointer",
                        transition: "all 0.16s",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>
                {role === "volunteer" && (
                  <VolunteerFields form={volunteerForm} setForm={setVolunteerForm} />
                )}
                {role === "doctor" && (
                  <DoctorFields form={doctorForm} setForm={setDoctorForm} />
                )}
                {role === "pharmacy" && (
                  <PharmacyFields form={pharmacyForm} setForm={setPharmacyForm} />
                )}

                {/* Password field for all roles */}
                <FieldWrapper label="Password">
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder="Create a password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </FieldWrapper>

                {error && (
                  <div style={{ marginBottom: 12, padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #EF4444", borderRadius: 8, color: "#991b1b", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    backgroundColor: loading ? "#9CA3AF" : COLORS.primary,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: 4,
                    letterSpacing: "0.01em",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = COLORS.primaryHover; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = COLORS.primary; }}
                >
                  {loading ? "Please wait…" : "Register & Continue"}
                </button>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "#6B7280",
                    marginTop: 16,
                    marginBottom: 0,
                  }}
                >
                  Already a member?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.primary,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 13,
                      textDecoration: "underline",
                    }}
                  >
                    Login here
                  </button>
                </p>
              </form>
            </>
          ) : (
            <LoginForm onSwitchToSignup={() => setAuthMode("signup")} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Field Components ── */

function FieldWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: "#6B7280",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        {label} <span style={{ color: "#EF4444" }}>*</span>
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 15,
  color: "#111827",
  backgroundColor: "#f9fafb",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

function VolunteerFields({
  form,
  setForm,
}: {
  form: VolunteerForm;
  setForm: React.Dispatch<React.SetStateAction<VolunteerForm>>;
}) {
  return (
    <>
      <FieldWrapper label="Full Name">
        <input
          style={inputStyle}
          type="text"
          placeholder="Your full name"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Email Address">
        <input
          style={inputStyle}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Phone Number (Optional)">
        <input
          style={inputStyle}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Date of Birth">
        <input
          style={inputStyle}
          type="date"
          value={form.dob}
          onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Blood Group">
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={form.bloodGroup}
          onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        >
          <option value="">Select blood group</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </FieldWrapper>
      <FieldWrapper label="Profession">
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. Nurse, Teacher, Driver"
          value={form.profession}
          onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Availability / Preferred Timing">
        <input
          style={inputStyle}
          type="time"
          value={form.availability}
          onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
    </>
  );
}

function DoctorFields({
  form,
  setForm,
}: {
  form: DoctorForm;
  setForm: React.Dispatch<React.SetStateAction<DoctorForm>>;
}) {
  return (
    <>
      <FieldWrapper label="Full Name">
        <input
          style={inputStyle}
          type="text"
          placeholder="Dr. Full Name"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Email Address">
        <input
          style={inputStyle}
          type="email"
          placeholder="doctor@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Phone Number (Optional)">
        <input
          style={inputStyle}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Date of Birth">
        <input
          style={inputStyle}
          type="date"
          value={form.dob}
          onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Blood Group">
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={form.bloodGroup}
          onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        >
          <option value="">Select blood group</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </FieldWrapper>
      <FieldWrapper label="Medical Specialty">
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. General, Cardiology"
          value={form.specialty}
          onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Doctor Registration Number">
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. MCI-12345"
          value={form.doctorRegistrationNumber}
          onChange={(e) => setForm((f) => ({ ...f, doctorRegistrationNumber: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
    </>
  );
}

function PharmacyFields({
  form,
  setForm,
}: {
  form: PharmacyForm;
  setForm: React.Dispatch<React.SetStateAction<PharmacyForm>>;
}) {
  return (
    <>
      <FieldWrapper label="Full Name">
        <input
          style={inputStyle}
          type="text"
          placeholder="Pharmacy / Person Name"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Email Address">
        <input
          style={inputStyle}
          type="email"
          placeholder="pharmacy@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Phone Number (Optional)">
        <input
          style={inputStyle}
          type="tel"
          placeholder="+91 XXXXX XXXXX"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <FieldWrapper label="Date of Birth">
        <input
          style={inputStyle}
          type="date"
          value={form.dob}
          onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            color: "#6B7280",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: 5,
          }}
        >
          Pharmacy Address <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 72,
          }}
          placeholder="Full address of the pharmacy"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </div>
      <FieldWrapper label="Pharmacy Registration Number">
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. PH-987654"
          value={form.pharmacyRegistrationNumber}
          onChange={(e) => setForm((f) => ({ ...f, pharmacyRegistrationNumber: e.target.value }))}
          required
          onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
      </FieldWrapper>
    </>
  );
}

/* ── Login Form ── */
function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("karuna_token", data.access_token || data.session?.access_token || "");
      localStorage.setItem("karuna_role", data.user?.role || "volunteer");
      localStorage.setItem("karuna_user_name", data.user?.full_name || "");
      localStorage.setItem("karuna_user_email", email);
      const r = data.user?.role || "volunteer";
      if (r === "doctor") navigate("/doctor");
      else if (r === "pharmacy") navigate("/pharmacy");
      else navigate("/volunteer/join");
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #E5E7EB", paddingBottom: 16 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#6B7280",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Welcome Back
        </p>
      </div>
      {error && (
        <div style={{ margin: "12px 24px 0", padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #EF4444", borderRadius: 8, color: "#991b1b", fontSize: 13, fontWeight: 500, textAlign: "center" }}>
          ⚠️ {error}
        </div>
      )}
      <form
        style={{ padding: "20px 24px 24px" }}
        onSubmit={handleLogin}
      >
        <FieldWrapper label="Email Address">
          <input
            style={inputStyle}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
          />
        </FieldWrapper>

        <FieldWrapper label="Password">
          <input
            style={inputStyle}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
          />
        </FieldWrapper>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 0",
            backgroundColor: loading ? "#9CA3AF" : COLORS.primary,
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = COLORS.primaryHover;
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          {loading ? "Logging in…" : "Login"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#6B7280",
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          New member?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            style={{
              background: "none",
              border: "none",
              color: COLORS.primary,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              fontSize: 13,
              textDecoration: "underline",
            }}
          >
            Sign up here
          </button>
        </p>
      </form>
    </>
  );
}