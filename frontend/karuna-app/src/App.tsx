import React, { Suspense, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';

// ── Import all the user-designed pages ────────────────────────────────────────
import { SignupPage } from './components/SignupPage';
import { VolunteerJoinPage } from './components/VolunteerJoinPage';
import { NursePage } from './components/NursePage';
import { ChatbotPage } from './components/ChatbotPage';
import { PharmacyFormPage } from './components/PharmacyFormPage';
import { DoctorOnboardingPage } from './components/DoctorOnboardingPage';
import { DriverUIPage } from './components/DriverUIPage';
import { PharmacyDashboardPage } from './components/PharmacyDashboardPage';
import { DoctorDashboardPage } from './components/DoctorDashboardPage';
import { JoinSitePage } from './components/JoinSitePage';
import { AdminBypassPage } from './components/AdminBypassPage';
import DriverActivePage from './DriverActivePage';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
    primary: '#4F46E5', primaryHover: '#4338CA', secondary: '#6366F1',
    accent: '#F97316', accentHover: '#ea580c', danger: '#EF4444',
    success: '#22C55E', bg: '#f9fafb', card: '#ffffff',
    text: '#111827', muted: '#6B7280', border: '#E5E7EB',
};

// ── Loading Spinner ───────────────────────────────────────────────────────────
const LoadingSpinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.bg }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: `4px solid ${C.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
);

// ── Global Navbar ─────────────────────────────────────────────────────────────
function Header() {
    const loc = useLocation();
    const name = localStorage.getItem('karuna_user_name') || '';
    const isLoggedIn = !!localStorage.getItem('karuna_token');

    const logout = () => {
        localStorage.removeItem('karuna_token');
        localStorage.removeItem('karuna_role');
        localStorage.removeItem('karuna_user_name');
        localStorage.removeItem('karuna_user_email');
        localStorage.removeItem('karuna_user_id');
        window.location.href = '/';
    };

    // User initials for profile icon
    const initials = name ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?';

    return (
        <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', height: 56, background: '#fff',
            borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
            {/* ── Left: Logo + Nav Tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.primary, letterSpacing: '-0.02em' }}>🏥 Karuna</span>
                </Link>
                <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <HeaderTab to="/help" label="💬 Helping Chat Bot" active={loc.pathname === '/help'} />
                    <HeaderTab to="/donate" label="❤️ Donate" active={loc.pathname === '/donate'} />
                </nav>
            </div>

            {/* ── Right: Auth / Profile ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!isLoggedIn && (
                    <>
                        <Link to="/" style={{
                            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            textDecoration: 'none', color: C.muted, transition: 'all 0.15s',
                            border: `1px solid ${C.border}`, background: '#fff',
                        }}>Sign Up</Link>
                        <Link to="/login" style={{
                            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                            textDecoration: 'none', color: '#fff', background: C.primary,
                            border: 'none', transition: 'all 0.15s',
                        }}>Login</Link>
                    </>
                )}
                {/* Profile Icon */}
                {isLoggedIn ? (
                    <div style={{ position: 'relative' }}>
                        <button onClick={logout} title={`${name} — Click to Logout`} style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{initials}</button>
                    </div>
                ) : (
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', border: `2px solid ${C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: C.muted, fontSize: 16,
                    }}>👤</div>
                )}
            </div>
        </header>
    );
}

const HeaderTab = ({ to, label, active }: { to: string; label: string; active: boolean }) => (
    <Link to={to} style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        textDecoration: 'none', transition: 'all 0.15s',
        background: active ? `${C.primary}12` : 'transparent',
        color: active ? C.primary : C.muted,
    }}>{label}</Link>
);

// ── Home Page — Role Selector ─────────────────────────────────────────────────
function HomePage() {
    const isLoggedIn = !!localStorage.getItem('karuna_token');
    const role = localStorage.getItem('karuna_role') || '';

    if (isLoggedIn) {
        if (role === 'doctor') return <Navigate to="/doctor" />;
        if (role === 'pharmacy') return <Navigate to="/pharmacy" />;
        return <Navigate to="/volunteer/join" />;
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: `linear-gradient(180deg, ${C.bg} 0%, #eef2ff 100%)` }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 8, textAlign: 'center' }}>
                Welcome to <span style={{ color: C.primary }}>Karuna</span>
            </h1>
            <p style={{ fontSize: 16, color: C.muted, marginBottom: 40, textAlign: 'center', maxWidth: 500 }}>
                Disaster Relief Coordination Platform — Choose your role to get started
            </p>

            {/* Role Boxes — 3-col on desktop, stacked on mobile via CSS */}
            <div className="role-grid" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
                <RoleCard to="/volunteer/join" emoji="🤝" title="Volunteer" desc="Join relief sites, assist nurses, deliver supplies" color="#22C55E" />
                <RoleCard to="/doctor/onboarding" emoji="🩺" title="Doctor" desc="Register as a medical professional, manage patients" color="#3B82F6" />
                <RoleCard to="/pharmacy/form" emoji="💊" title="Pharmacist" desc="Register your pharmacy, fulfill medicine orders" color="#8B5CF6" />
            </div>

            <div style={{ marginTop: 40 }}>
                <Link to="/help" style={{
                    padding: '14px 32px', borderRadius: 12, background: C.accent, color: '#fff',
                    fontWeight: 700, fontSize: 16, textDecoration: 'none',
                    boxShadow: `0 4px 20px ${C.accent}44`, transition: 'all 0.15s',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>🆘 I Need Emergency Help</Link>
            </div>

            <p style={{ marginTop: 32, fontSize: 13, color: C.muted }}>
                Already have an account? <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>Log In →</Link>
            </p>
        </div>
    );
}

function RoleCard({ to, emoji, title, desc, color }: { to: string; emoji: string; title: string; desc: string; color: string }) {
    const [hovered, setHovered] = useState(false);
    return (
        <Link to={to} style={{ textDecoration: 'none', flex: '1 1 250px', maxWidth: 280 }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div style={{
                background: C.card, borderRadius: 16, padding: '36px 28px',
                border: `2px solid ${hovered ? color : C.border}`,
                boxShadow: hovered ? `0 8px 32px ${color}25` : '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'all 0.25s ease', transform: hovered ? 'translateY(-4px)' : 'none',
                cursor: 'pointer', textAlign: 'center',
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>{title}</h2>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5 }}>{desc}</p>
                <div style={{
                    marginTop: 20, display: 'inline-block', padding: '8px 20px', borderRadius: 8,
                    background: hovered ? color : `${color}15`, color: hovered ? '#fff' : color,
                    fontWeight: 700, fontSize: 13, transition: 'all 0.25s',
                }}>Get Started →</div>
            </div>
        </Link>
    );
}

// ── Donate Page (placeholder) ─────────────────────────────────────────────────
const DonatePage = () => (
    <div style={{ textAlign: 'center', padding: 80 }}>
        <h1 style={{ fontSize: 36, color: C.primary, marginBottom: 12 }}>❤️ Donate</h1>
        <p style={{ color: C.muted, fontSize: 16, maxWidth: 400, margin: '0 auto' }}>
            Support Karuna's disaster relief operations. Every contribution helps save lives.
        </p>
    </div>
);

// ── 404 ───────────────────────────────────────────────────────────────────────
const NotFound = () => (
    <div style={{ textAlign: 'center', padding: 80 }}>
        <h1 style={{ fontSize: 48, color: C.primary }}>404</h1>
        <p style={{ color: C.muted, marginBottom: 24 }}>Page not found</p>
        <Link to="/" style={{ color: C.primary, fontWeight: 600 }}>← Back to Home</Link>
    </div>
);

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Inter', -apple-system, sans-serif; background: ${C.bg}; }
                @keyframes spin { to { transform: rotate(360deg); } }
                /* Responsive role grid: stack on mobile */
                @media (max-width: 700px) {
                    .role-grid { flex-direction: column !important; align-items: center !important; }
                    .role-grid > a { max-width: 100% !important; width: 100% !important; }
                }
            `}</style>
            <Header />
            <main style={{ minHeight: 'calc(100vh - 56px)' }}>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />

                        {/* Join Site */}
                        <Route path="/join" element={<JoinSitePage />} />

                        {/* Emergency Help — the user's Chatbot UI */}
                        <Route path="/help" element={<ChatbotPage />} />

                        {/* Donate */}
                        <Route path="/donate" element={<DonatePage />} />

                        {/* Admin Bypass */}
                        <Route path="/admin-bypass-login" element={<AdminBypassPage />} />

                        {/* Volunteer flow */}
                        <Route path="/volunteer/join" element={<VolunteerJoinPage />} />
                        <Route path="/nurse" element={<NursePage />} />
                        <Route path="/driver" element={<DriverUIPage />} />
                        <Route path="/driver/active" element={<DriverActivePage />} />

                        {/* Pharmacy flow */}
                        <Route path="/pharmacy/form" element={<PharmacyFormPage />} />
                        <Route path="/pharmacy" element={<PharmacyDashboardPage />} />

                        {/* Doctor flow */}
                        <Route path="/doctor/onboarding" element={<DoctorOnboardingPage />} />
                        <Route path="/doctor" element={<DoctorDashboardPage />} />

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>
        </>
    );
}
