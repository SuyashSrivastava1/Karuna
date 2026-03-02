import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';

// Lazy-load pages from sibling project folders
const DoctorDashboardPage = lazy(() =>
    import('../../Doctor Dashboard/src/app/components/DoctorDashboardPage').then(m => ({ default: m.DoctorDashboardPage }))
);
const DoctorOnboardingPage = lazy(() =>
    import('../../Doctor Onboarding/src/app/components/DoctorOnboardingPage').then(m => ({ default: m.DoctorOnboardingPage }))
);
const PharmacyDashboardPage = lazy(() =>
    import('../../Pharmacy Dashboard/src/app/components/PharmacyDashboardPage').then(m => ({ default: m.PharmacyDashboardPage }))
);
const PharmacyFormPage = lazy(() =>
    import('../../Pharmacy Form/src/app/components/PharmacyFormPage').then(m => ({ default: m.PharmacyFormPage }))
);
const NursePage = lazy(() =>
    import('../../Nurse Page/src/app/components/NursePage').then(m => ({ default: m.NursePage }))
);
const DriverUIPage = lazy(() =>
    import('../../Driver UI/src/app/components/DriverUIPage').then(m => ({ default: m.DriverUIPage }))
);
const ChatbotPage = lazy(() =>
    import('../../Chatbot UI/src/app/components/ChatbotPage').then(m => ({ default: m.ChatbotPage }))
);
const VolunteerJoinPage = lazy(() =>
    import('../../Volunteer Join Form/src/app/components/VolunteerJoinPage').then(m => ({ default: m.VolunteerJoinPage }))
);

// ── Simple Loading Spinner ──
const LoadingSpinner = () => (
    <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#f9fafb'
    }}>
        <div style={{
            width: 40, height: 40, border: '4px solid #e5e7eb',
            borderTop: '4px solid #0d9488', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ── Navigation Header ──
const Header = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname.startsWith(path);

    // Get logged in user info from localStorage
    const role = localStorage.getItem('karuna_role') || '';
    const userName = localStorage.getItem('karuna_user_name') || '';
    const isLoggedIn = !!localStorage.getItem('karuna_token');

    const handleLogout = () => {
        localStorage.removeItem('karuna_token');
        localStorage.removeItem('karuna_role');
        localStorage.removeItem('karuna_user_name');
        localStorage.removeItem('karuna_user_id');
        window.location.href = '/';
    };

    return (
        <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb',
            position: 'sticky', top: 0, zIndex: 100
        }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#0d9488' }}>🏥 Karuna</span>
            </Link>

            {/* Nav Links */}
            <nav style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {isLoggedIn && (
                    <>
                        {role === 'doctor' && (
                            <NavLink to="/doctor" active={isActive('/doctor')}>Doctor Dashboard</NavLink>
                        )}
                        {role === 'pharmacy' && (
                            <NavLink to="/pharmacy" active={isActive('/pharmacy')}>Pharmacy Dashboard</NavLink>
                        )}
                        {role === 'volunteer' && (
                            <>
                                <NavLink to="/volunteer/join" active={isActive('/volunteer/join')}>Join Site</NavLink>
                                <NavLink to="/nurse" active={isActive('/nurse')}>Nurse</NavLink>
                                <NavLink to="/driver" active={isActive('/driver')}>Driver</NavLink>
                            </>
                        )}
                    </>
                )}

                {/* Always visible */}
                <Link to="/help" style={{
                    padding: '8px 16px', borderRadius: 8, background: '#f59d62',
                    color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: 14
                }}>
                    🆘 Help Me
                </Link>

                {isLoggedIn ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#6B7280' }}>
                            {userName} ({role})
                        </span>
                        <button onClick={handleLogout} style={{
                            padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb',
                            background: '#fff', cursor: 'pointer', fontSize: 13, color: '#EF4444'
                        }}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <NavLink to="/" active={isActive('/')}>Login</NavLink>
                )}
            </nav>
        </header>
    );
};

const NavLink = ({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) => (
    <Link to={to} style={{
        padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 500,
        background: active ? '#0d948815' : 'transparent',
        color: active ? '#0d9488' : '#374151',
        border: active ? '1px solid #0d9488' : '1px solid transparent'
    }}>
        {children}
    </Link>
);

// ── Home Page ──
const HomePage = () => {
    const isLoggedIn = !!localStorage.getItem('karuna_token');
    const role = localStorage.getItem('karuna_role') || '';

    if (isLoggedIn) {
        if (role === 'doctor') return <Navigate to="/doctor" />;
        if (role === 'pharmacy') return <Navigate to="/pharmacy" />;
        if (role === 'volunteer') return <Navigate to="/volunteer/join" />;
    }

    return <LoginPage />;
};

// ── 404 ──
const NotFound = () => (
    <div style={{ textAlign: 'center', padding: 80 }}>
        <h1 style={{ fontSize: 48, color: '#0d9488' }}>404</h1>
        <p style={{ color: '#6B7280', marginBottom: 24 }}>Page not found</p>
        <Link to="/" style={{ color: '#0d9488', fontWeight: 600 }}>← Back to Home</Link>
    </div>
);

// ── App ──
export default function App() {
    return (
        <>
            <Header />
            <main style={{ minHeight: 'calc(100vh - 60px)' }}>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />

                        {/* Doctor */}
                        <Route path="/doctor" element={<DoctorDashboardPage />} />
                        <Route path="/doctor/onboarding" element={<DoctorOnboardingPage />} />

                        {/* Pharmacy */}
                        <Route path="/pharmacy" element={<PharmacyDashboardPage />} />
                        <Route path="/pharmacy/form" element={<PharmacyFormPage />} />

                        {/* Volunteer roles */}
                        <Route path="/volunteer/join" element={<VolunteerJoinPage />} />
                        <Route path="/nurse" element={<NursePage />} />
                        <Route path="/driver" element={<DriverUIPage />} />

                        {/* Emergency chatbot */}
                        <Route path="/help" element={<ChatbotPage />} />

                        {/* Catch-all */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </main>
        </>
    );
}
