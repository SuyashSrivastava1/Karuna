import React, { useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

const C = {
    primary: '#0d9488', primaryHover: '#0f766e',
    secondary: '#0e7490', accent: '#f59d62',
    danger: '#EF4444', success: '#22C55E',
    bg: '#f9fafb', card: '#ffffff',
    text: '#111827', muted: '#6B7280', border: '#E5E7EB',
};

type Step = 'choose' | 'login' | 'register' | 'otp';

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: `1px solid ${C.border}`,
    borderRadius: 10, fontSize: 15, color: C.text, backgroundColor: C.bg,
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s',
};

const btnStyle: React.CSSProperties = {
    width: '100%', padding: '14px 0', backgroundColor: C.primary, color: '#fff',
    border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'background 0.15s', letterSpacing: '0.02em',
};

export default function LoginPage() {
    const [step, setStep] = useState<Step>('choose');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Register fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Login failed');
            setSuccess('OTP sent to your phone!');
            setStep('otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), token: otp.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'OTP verification failed');

            // Store authentication
            if (data.session?.access_token) {
                localStorage.setItem('karuna_token', data.session.access_token);
            }
            if (data.user?.id) {
                localStorage.setItem('karuna_user_id', data.user.id);
            }

            // Fetch user profile to get role
            const token = data.session?.access_token;
            if (token) {
                const meRes = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const profile = await meRes.json().catch(() => ({}));
                if (profile.role) {
                    localStorage.setItem('karuna_role', profile.role);
                    localStorage.setItem('karuna_user_name', profile.full_name || '');
                }

                // Redirect based on role
                if (profile.role === 'doctor') window.location.href = '/doctor';
                else if (profile.role === 'pharmacy') window.location.href = '/pharmacy';
                else if (profile.role === 'volunteer') window.location.href = '/volunteer/join';
                else window.location.href = '/';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'OTP verification failed');
        } finally { setLoading(false); }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone.trim(), full_name: fullName.trim(),
                    email: email.trim(), role, password: password || phone.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            // Store auth immediately if session is returned
            if (data.session?.access_token) {
                localStorage.setItem('karuna_token', data.session.access_token);
                localStorage.setItem('karuna_role', role);
                localStorage.setItem('karuna_user_name', fullName.trim());
                if (data.user?.id) localStorage.setItem('karuna_user_id', data.user.id);

                // Redirect to onboarding flow based on role
                if (role === 'doctor') window.location.href = '/doctor/onboarding';
                else if (role === 'pharmacy') window.location.href = '/pharmacy/form';
                else if (role === 'volunteer') window.location.href = '/volunteer/join';
                else window.location.href = '/';
            } else {
                setSuccess('Account created! You can now log in.');
                setStep('login');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally { setLoading(false); }
    };

    const RoleOption = ({ value, emoji, label }: { value: string; emoji: string; label: string }) => (
        <button type="button" onClick={() => setRole(value)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderRadius: 10, border: `2px solid ${role === value ? C.primary : C.border}`,
            backgroundColor: role === value ? `${C.primary}10` : '#fff',
            cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
        }}>
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <span style={{ fontSize: 14, fontWeight: role === value ? 700 : 500, color: role === value ? C.primary : C.text }}>{label}</span>
        </button>
    );

    return (
        <div style={{
            maxWidth: 420, margin: '60px auto', padding: 32,
            background: C.card, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: C.primary, margin: '0 0 4px' }}>🏥 Karuna</h1>
                <p style={{ color: C.muted, fontSize: 14 }}>Disaster Relief Coordination</p>
            </div>

            {/* Error / Success messages */}
            {error && (
                <div style={{
                    padding: '10px 14px', backgroundColor: '#FEF2F2', border: `1px solid ${C.danger}`,
                    borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.danger
                }}>⚠️ {error}</div>
            )}
            {success && (
                <div style={{
                    padding: '10px 14px', backgroundColor: '#F0FDF4', border: `1px solid ${C.success}`,
                    borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#16a34a'
                }}>✓ {success}</div>
            )}

            {/* Step: Choose login or register */}
            {step === 'choose' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button onClick={() => { setStep('login'); setError(''); setSuccess(''); }}
                        style={{ ...btnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        🔑 Log In
                    </button>
                    <button onClick={() => { setStep('register'); setError(''); setSuccess(''); }}
                        style={{ ...btnStyle, backgroundColor: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        ✨ Create Account
                    </button>
                    <div style={{ margin: '8px 0', borderTop: `1px solid ${C.border}` }} />
                    <a href="/help" style={{
                        display: 'block', padding: '14px', borderRadius: 10, background: C.accent,
                        color: '#fff', fontWeight: 600, textDecoration: 'none', textAlign: 'center', fontSize: 15,
                    }}>🆘 I Need Emergency Help</a>
                </div>
            )}

            {/* Step: Login with phone */}
            {step === 'login' && (
                <form onSubmit={handleLogin}>
                    <label style={{
                        display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
                        letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8
                    }}>Phone Number</label>
                    <input style={inputStyle} type="tel" placeholder="+91 XXXXX XXXXX" value={phone}
                        onChange={e => setPhone(e.target.value)} required autoFocus
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e => e.target.style.borderColor = C.border} />
                    <button type="submit" disabled={loading}
                        style={{ ...btnStyle, marginTop: 16, opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Sending OTP…' : 'Send OTP →'}
                    </button>
                    <button type="button" onClick={() => setStep('choose')}
                        style={{
                            width: '100%', marginTop: 10, padding: '10px', background: 'none',
                            border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13
                        }}>← Back</button>
                </form>
            )}

            {/* Step: OTP verification */}
            {step === 'otp' && (
                <form onSubmit={handleVerifyOtp}>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Enter the 6-digit OTP sent to <b>{phone}</b></p>
                    <input style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: '0.5em', fontWeight: 700 }}
                        type="text" maxLength={6} placeholder="• • • • • •" value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required autoFocus
                        onFocus={e => e.target.style.borderColor = C.primary}
                        onBlur={e => e.target.style.borderColor = C.border} />
                    <button type="submit" disabled={loading || otp.length !== 6}
                        style={{ ...btnStyle, marginTop: 16, opacity: loading || otp.length !== 6 ? 0.7 : 1 }}>
                        {loading ? 'Verifying…' : 'Verify & Login →'}
                    </button>
                    <button type="button" onClick={() => { setStep('login'); setOtp(''); setError(''); }}
                        style={{
                            width: '100%', marginTop: 10, padding: '10px', background: 'none',
                            border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13
                        }}>← Change Phone Number</button>
                </form>
            )}

            {/* Step: Register */}
            {step === 'register' && (
                <form onSubmit={handleRegister}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
                                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6
                            }}>
                                Full Name <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input style={inputStyle} type="text" placeholder="Your full name" value={fullName}
                                onChange={e => setFullName(e.target.value)} required autoFocus
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <div>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
                                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6
                            }}>
                                Phone Number <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input style={inputStyle} type="tel" placeholder="+91 XXXXX XXXXX" value={phone}
                                onChange={e => setPhone(e.target.value)} required
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <div>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
                                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6
                            }}>
                                Email <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>(optional)</span>
                            </label>
                            <input style={inputStyle} type="email" placeholder="you@example.com" value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <div>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
                                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6
                            }}>
                                Password <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>(optional — defaults to phone)</span>
                            </label>
                            <input style={inputStyle} type="password" placeholder="••••••••" value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                        </div>
                        <div>
                            <label style={{
                                display: 'block', fontSize: 11, fontWeight: 600, color: C.muted,
                                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8
                            }}>
                                I am a… <span style={{ color: C.danger }}>*</span>
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <RoleOption value="doctor" emoji="🩺" label="Doctor" />
                                <RoleOption value="pharmacy" emoji="💊" label="Pharmacy" />
                                <RoleOption value="volunteer" emoji="🤝" label="Volunteer" />
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading || !role}
                        style={{ ...btnStyle, marginTop: 20, opacity: loading || !role ? 0.7 : 1 }}>
                        {loading ? 'Creating Account…' : 'Create Account →'}
                    </button>
                    <button type="button" onClick={() => setStep('choose')}
                        style={{
                            width: '100%', marginTop: 10, padding: '10px', background: 'none',
                            border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13
                        }}>← Back</button>
                </form>
            )}

            {/* Footer link */}
            {step === 'login' && (
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.muted }}>
                    Don't have an account?{' '}
                    <span onClick={() => { setStep('register'); setError(''); }}
                        style={{ color: C.primary, fontWeight: 600, cursor: 'pointer' }}>Sign Up</span>
                </p>
            )}
            {step === 'register' && (
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.muted }}>
                    Already have an account?{' '}
                    <span onClick={() => { setStep('login'); setError(''); }}
                        style={{ color: C.primary, fontWeight: 600, cursor: 'pointer' }}>Log In</span>
                </p>
            )}
        </div>
    );
}
