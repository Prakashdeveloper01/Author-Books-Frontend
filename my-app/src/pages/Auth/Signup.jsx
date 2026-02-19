import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Command } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { signup, login, getProfile, sendOtp, verifyOtp } from '../../services/api';
import './Auth.css';

const Signup = () => {
    const [role, setRole] = useState('reviewer'); // 'reviewer' or 'author'
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    useEffect(() => {
        let timer;
        if (showOtpModal && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [showOtpModal, timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const validateForm = () => {
        if (formData.username.length < 3) return 'Username must be at least 3 characters.';
        if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email address.';
        if (formData.password.length < 8) return 'Password must be at least 8 characters.';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            await sendOtp(formData.email);
            setShowOtpModal(true);
            setTimeLeft(300); // Reset timer to 5 minutes
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timeLeft > 0) return;
        setIsLoading(true);
        setError('');
        try {
            await sendOtp(formData.email);
            setTimeLeft(300);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndSignup = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await verifyOtp(formData.email, otpCode);

            // Proceed to signup
            await signup({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                type: role,
            });

            const loginResponse = await login(formData.username, formData.password);
            localStorage.setItem('token', loginResponse.accessToken);
            localStorage.setItem('refreshToken', loginResponse.refreshToken);
            localStorage.setItem('userType', loginResponse.userType);

            try {
                const profile = await getProfile();
                localStorage.setItem('userProfile', JSON.stringify(profile));
            } catch (profileError) { console.warn(profileError); }

            if (loginResponse.userType === 'author') {
                navigate('/author-dashboard');
            } else {
                navigate('/reader-dashboard');
            }

        } catch (err) {
            setError(err.response?.data?.detail || 'Verification or Signup failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="page-bg-accent"></div>

            <div className="auth-logo-header">
                <Command size={32} className="auth-logo-icon" />
                <span className="auth-logo-text">Athenaeum</span>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">
                        Get started with your free account today.
                    </p>
                </div>

                <form onSubmit={handleRequestOtp} className="form-stack">

                    {/* PROFESSIONAL SEGMENTED TOGGLE */}
                    <div className="role-segmented">
                        <div
                            className={`role-option ${role === 'reviewer' ? 'active' : ''}`}
                            onClick={() => setRole('reviewer')}
                        >
                            Reader Account
                        </div>
                        <div
                            className={`role-option ${role === 'author' ? 'active' : ''}`}
                            onClick={() => setRole('author')}
                        >
                            Author Account
                        </div>
                    </div>

                    {error && !showOtpModal && <div style={{ color: '#c01c28', background: '#ffebeb', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #f8c4c4' }}>{error}</div>}

                    <Input
                        id="username"
                        label="Username"
                        type="text"
                        placeholder="e.g. library_fan"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="email"
                        label="Email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </Button>
                </form>

                {/* OTP MODAL */}
                {showOtpModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                onClick={() => setShowOtpModal(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>

                            <div className="modal-header">
                                <h3 className="modal-title">Verify Email</h3>
                                <p className="modal-subtitle">
                                    We sent a code to <strong>{formData.email}</strong>.
                                    Enter it below to verify your account.
                                </p>
                            </div>

                            {error && <div style={{ color: '#c01c28', background: '#ffebeb', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #f8c4c4', marginBottom: '1rem' }}>{error}</div>}

                            <form onSubmit={handleVerifyAndSignup}>
                                <Input
                                    id="otp"
                                    label="OTP Code"
                                    type="text"
                                    placeholder="e.g. 123456"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div className="otp-timer">
                                    {timeLeft > 0 ? (
                                        <span>Code expires in {formatTime(timeLeft)}</span>
                                    ) : (
                                        <span className="otp-timer expired">Code expired</span>
                                    )}
                                </div>

                                <Button type="submit" disabled={isLoading || timeLeft === 0} style={{ marginTop: '1rem', width: '100%' }}>
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Sign up'}
                                </Button>
                            </form>

                            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                                Didn't receive code?{' '}
                                <button
                                    onClick={handleResendOtp}
                                    disabled={timeLeft > 0 || isLoading}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: timeLeft > 0 ? '#ccc' : 'var(--primary)',
                                        cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
                                        textDecoration: 'underline',
                                        padding: 0
                                    }}
                                >
                                    Resend
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login" className="auth-link" style={{ marginLeft: '0.5rem' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
