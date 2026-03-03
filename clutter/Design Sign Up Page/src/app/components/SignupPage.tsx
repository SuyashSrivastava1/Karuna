import { useState } from "react";

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
}

interface DoctorForm {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  bloodGroup: string;
  specialty: string;
}

interface PharmacyForm {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
}

export function SignupPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [role, setRole] = useState<Role>("volunteer");

  const [volunteerForm, setVolunteerForm] = useState<VolunteerForm>({
    fullName: "", email: "", phone: "", dob: "", bloodGroup: "", profession: "",
  });
  const [doctorForm, setDoctorForm] = useState<DoctorForm>({
    fullName: "", email: "", phone: "", dob: "", bloodGroup: "", specialty: "",
  });
  const [pharmacyForm, setPharmacyForm] = useState<PharmacyForm>({
    fullName: "", email: "", phone: "", dob: "", address: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
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
            href="http://localhost:5182"
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
            <button
              style={{
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
            </button>
            <button
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

                {/* Submit */}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    backgroundColor: COLORS.primary,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 4,
                    letterSpacing: "0.01em",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = COLORS.primaryHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = COLORS.primary)
                  }
                >
                  Register &amp; Continue →
                </button>

                {submitted && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #22C55E",
                      borderRadius: 8,
                      color: "#16a34a",
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: "center",
                    }}
                  >
                    ✓ Registration submitted! Redirecting to dashboard…
                  </div>
                )}

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
    </>
  );
}

/* ── Login Form ── */
function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

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
      <form
        style={{ padding: "20px 24px 24px" }}
        onSubmit={(e) => e.preventDefault()}
      >
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
            Email Address <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
            <button
              type="button"
              onClick={() => setOtpSent(true)}
              style={{
                padding: "9px 14px",
                backgroundColor: COLORS.primary,
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.primaryHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = COLORS.primary)
              }
            >
              Send OTP
            </button>
          </div>
          {otpSent && (
            <p style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
              📧 OTP sent to <strong>{email}</strong>. Check your inbox.
            </p>
          )}
        </div>

        {otpSent && (
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
              Enter OTP <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              style={inputStyle}
              type="text"
              placeholder="6-digit OTP from your email"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            />
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px 0",
            backgroundColor: otpSent ? COLORS.primary : "#E5E7EB",
            color: otpSent ? "#ffffff" : "#9CA3AF",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: otpSent ? "pointer" : "not-allowed",
            marginTop: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (otpSent) e.currentTarget.style.backgroundColor = COLORS.primaryHover;
          }}
          onMouseLeave={(e) => {
            if (otpSent) e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          Login →
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