import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

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

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
    primary: '#4F46E5', primaryHover: '#4338CA', secondary: '#6366F1',
    accent: '#F97316', accentHover: '#ea580c', danger: '#EF4444',
    success: '#22C55E', bg: '#f9fafb', card: '#ffffff',
    text: '#111827', muted: '#6B7280', border: '#E5E7EB',
};

// ── Header ────────────────────────────────────────────────────────────────────
function Header() {
    const loc = useLocation();
    const role = localStorage.getItem('karuna_role') || '';
    const name = localStorage.getItem('karuna_user_name') || '';
    const isLoggedIn = !!localStorage.getItem('karuna_token');

    const logout = () => {
        localStorage.removeItem('karuna_token');
        localStorage.removeItem('karuna_role');
        localStorage.removeItem('karuna_user_name');
        localStorage.removeItem('karuna_user_email');
        window.location.href = '/';
    };

    const nav = [
        { label: '🏠 Home', to: '/' },
        { label: '🆘 Help', to: '/help' },
    ];

    // Role-based nav items
    if (isLoggedIn) {
        if (role === 'volunteer') {
            nav.push({ label: '🤝 Volunteer', to: '/volunteer/join' });
            nav.push({ label: '🏥 Nurse', to: '/nurse' });
            nav.push({ label: '🚗 Driver', to: '/driver' });
        }
        if (role === 'doctor') {
            nav.push({ label: '🩺 Dashboard', to: '/doctor' });
            nav.push({ label: '⚙️ Onboarding', to: '/doctor/onboarding' });
        }
        if (role === 'pharmacy') {
            nav.push({ label: '💊 Dashboard', to: '/pharmacy' });
            nav.push({ label: '📋 Register', to: '/pharmacy/form' });
        }
    }

    return (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', background: '#fff', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: 8 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src="/logo.png" alt="Karuna" style={{ height: 32, width: 'auto', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </Link>

            <nav style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                {nav.map(n => (
                    <Link key={n.to} to={n.to} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        textDecoration: 'none', transition: 'all 0.15s',
                        background: loc.pathname === n.to ? `${C.primary}15` : 'transparent',
                        color: loc.pathname === n.to ? C.primary : C.muted,
                    }}>{n.label}</Link>
                ))}

                {isLoggedIn ? (
                    <button onClick={logout} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}>
                        {name ? `${name} — Logout` : 'Logout'}
                    </button>
                ) : (
                    <Link to="/" style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${C.primary}`, background: 'transparent', color: C.primary, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginLeft: 8 }}>
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
}

// ── 404 ──
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
            <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', -apple-system, sans-serif; background: ${C.bg}; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <Header />
            <main>
                <Routes>
                    {/* Home — the user's Sign Up / Login page */}
                    <Route path="/" element={<SignupPage />} />

                    {/* Join Site */}
                    <Route path="/join" element={<JoinSitePage />} />

                    {/* Emergency Help — the user's Chatbot UI */}
                    <Route path="/help" element={<ChatbotPage />} />

                    {/* Admin Bypass */}
                    <Route path="/admin-bypass-login" element={<AdminBypassPage />} />

                    {/* Volunteer flow */}
                    <Route path="/volunteer/join" element={<VolunteerJoinPage />} />
                    <Route path="/nurse" element={<NursePage />} />
                    <Route path="/driver" element={<DriverUIPage />} />

                    {/* Pharmacy flow */}
                    <Route path="/pharmacy/form" element={<PharmacyFormPage />} />
                    <Route path="/pharmacy" element={<PharmacyDashboardPage />} />

                    {/* Doctor flow */}
                    <Route path="/doctor/onboarding" element={<DoctorOnboardingPage />} />
                    <Route path="/doctor" element={<DoctorDashboardPage />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </>
    );
}
