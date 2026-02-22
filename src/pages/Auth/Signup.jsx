import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Command, BookOpen, PenTool, ArrowLeft, CheckCircle2, User, Mail, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { signup, login, getProfile, sendOtp, verifyOtp } from '../../services/api';
import './Auth.css';
import './Signup.css';

const Signup = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState(null); // 'reviewer' or 'author'

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [touched, setTouched] = useState({
        username: false,
        email: false,
        password: false,
        confirmPassword: false,
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(300);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleBlur = (e) => {
        setTouched({ ...touched, [e.target.id]: true });
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

    // Validation Logic
    const isUsernameValid = formData.username.length >= 3;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    // Password Checks
    const hasMinLength = formData.password.length >= 8;
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

    const metPasswordCriteriaCount = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    let strengthClass = '';
    if (metPasswordCriteriaCount === 0) strengthClass = '';
    else if (metPasswordCriteriaCount <= 2) strengthClass = 'strength-weak';
    else if (metPasswordCriteriaCount === 3) strengthClass = 'strength-medium';
    else strengthClass = 'strength-strong';

    const isPasswordValid = metPasswordCriteriaCount === 4;
    const isConfirmValid = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

    const validateForm = () => {
        if (!isUsernameValid) return 'Username must be at least 3 characters.';
        if (!isEmailValid) return 'Please enter a valid email address.';
        if (!isPasswordValid) return 'Please meet all password requirements.';
        if (!isConfirmValid) return 'Passwords do not match.';
        return null;
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');

        setTouched({ username: true, email: true, password: true, confirmPassword: true });

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            await sendOtp(formData.email);
            setShowOtpModal(true);
            setTimeLeft(300);
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
        <div className="signup-wizard-wrapper">
            <div className="signup-wizard-card">

                {step === 2 && !showOtpModal && (
                    <button className="wizard-back-btn fade-in-up" onClick={() => setStep(1)} type="button">
                        <ArrowLeft size={18} /> Back
                    </button>
                )}

                <div className="wizard-header fade-in-up">
                    <div className="wizard-logo">
                        <Command size={28} />
                    </div>
                    {step === 1 ? (
                        <>
                            <h1 className="wizard-title">Welcome to Athenaeum</h1>
                            <p className="wizard-subtitle">How are you planning to use the platform?</p>
                        </>
                    ) : (
                        <>
                            <h1 className="wizard-title">Create your account</h1>
                            <p className="wizard-subtitle">
                                {role === 'reviewer' ? 'Unlock endless stories and reviews.' : 'Start publishing to the world.'}
                            </p>
                        </>
                    )}
                </div>

                {/* Step Indicators */}
                {!showOtpModal && (
                    <div className="step-indicator fade-in-up">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
                    </div>
                )}

                {step === 1 && (
                    <div className="role-cards-container fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div
                            className={`role-card ${role === 'reviewer' ? 'selected' : ''}`}
                            onClick={() => setRole('reviewer')}
                        >
                            <div className="role-icon-wrapper">
                                <BookOpen size={24} />
                            </div>
                            <div className="role-card-content">
                                <h3 className="role-card-title">I'm a Reader</h3>
                                <p className="role-card-desc">Discover, read, and review books from diverse authors.</p>
                            </div>
                        </div>

                        <div
                            className={`role-card ${role === 'author' ? 'selected' : ''}`}
                            onClick={() => setRole('author')}
                        >
                            <div className="role-icon-wrapper">
                                <PenTool size={24} />
                            </div>
                            <div className="role-card-content">
                                <h3 className="role-card-title">I'm an Author</h3>
                                <p className="role-card-desc">Publish your work, grow your audience, and build your brand.</p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            style={{ className: '1.5rem', height: '54px', fontSize: '1.05rem', marginTop: '1rem' }}
                            onClick={() => setStep(2)}
                            disabled={!role}
                        >
                            Continue
                        </Button>

                        <div className="login-redirect">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </div>
                    </div>
                )}

                {step === 2 && !showOtpModal && (
                    <form onSubmit={handleRequestOtp} className="form-stack fade-in-up" style={{ animationDelay: '0.1s' }}>

                        {error && (
                            <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <Input
                            id="username"
                            label="Username"
                            type="text"
                            placeholder="e.g. library_fan"
                            icon={User}
                            value={formData.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            error={touched.username && !isUsernameValid ? "Username must be at least 3 characters." : null}
                        />

                        <Input
                            id="email"
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            icon={Mail}
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            error={touched.email && !isEmailValid ? "Please enter a valid email address." : null}
                        />

                        <div>
                            <Input
                                id="password"
                                label="Password"
                                type="password"
                                placeholder="Create a strong password"
                                icon={Lock}
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                error={touched.password && !isPasswordValid ? "Password requirements not met." : null}
                            />

                            {(touched.password || formData.password.length > 0) && !isPasswordValid && (
                                <div className="password-guidelines-compact">
                                    <div className="strength-bar-container">
                                        <div className={`strength-bar ${strengthClass}`}></div>
                                    </div>
                                    <div className={`guideline-item-c ${hasMinLength ? 'met' : ''}`}>
                                        <CheckCircle2 size={14} /> At least 8 characters
                                    </div>
                                    <div className={`guideline-item-c ${hasUpper ? 'met' : ''}`}>
                                        <CheckCircle2 size={14} /> Contains uppercase
                                    </div>
                                    <div className={`guideline-item-c ${hasNumber ? 'met' : ''}`}>
                                        <CheckCircle2 size={14} /> Contains a number
                                    </div>
                                    <div className={`guideline-item-c ${hasSpecial ? 'met' : ''}`}>
                                        <CheckCircle2 size={14} /> Special character
                                    </div>
                                </div>
                            )}
                        </div>

                        <Input
                            id="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            placeholder="Re-enter your password"
                            icon={Lock}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            error={touched.confirmPassword && !isConfirmValid ? "Passwords do not match." : null}
                        />

                        <Button type="submit" disabled={isLoading} style={{ marginTop: '1rem', height: '54px', fontSize: '1.05rem' }}>
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                        </Button>
                    </form>
                )}

                {/* OTP MODAL */}
                {showOtpModal && (
                    <div className="fade-in-up">
                        <div className="wizard-header" style={{ marginBottom: '1.5rem', marginTop: '-1rem' }}>
                            <h3 className="wizard-title" style={{ fontSize: '1.4rem' }}>Verify your email</h3>
                            <p className="wizard-subtitle">
                                We sent a code to <strong>{formData.email}</strong>
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
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>
                                {timeLeft > 0 ? (
                                    <span>Code expires in {formatTime(timeLeft)}</span>
                                ) : (
                                    <span style={{ color: 'var(--destructive)' }}>Code expired</span>
                                )}
                            </div>

                            <Button type="submit" disabled={isLoading || timeLeft === 0} style={{ marginTop: '1.5rem', width: '100%', height: '54px', fontSize: '1.05rem' }}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Sign up'}
                            </Button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
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
                                    padding: 0,
                                    fontWeight: '600'
                                }}
                            >
                                Resend
                            </button>
                        </div>

                        <div className="login-redirect" style={{ marginTop: '1.5rem' }}>
                            <button
                                onClick={() => {
                                    setShowOtpModal(false);
                                    setStep(2);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Change email
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Signup;
