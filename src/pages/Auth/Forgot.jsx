import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Command, ArrowLeft, Mail, Lock, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { forgotPassword, resetPassword } from '../../services/api';
import './Auth.css';
import './Signup.css';

const Forgot = () => {
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        email: '',
        otpCode: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [touched, setTouched] = useState({
        email: false,
        otpCode: false,
        newPassword: false,
        confirmPassword: false,
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleBlur = (e) => {
        setTouched({ ...touched, [e.target.id]: true });
    };

    useEffect(() => {
        let timer;
        if (step === 2 && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // Validation
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const hasMinLength = formData.newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(formData.newPassword);
    const hasNumber = /\d/.test(formData.newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    const metPasswordCriteriaCount = [hasMinLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    let strengthClass = '';
    if (metPasswordCriteriaCount === 0) strengthClass = '';
    else if (metPasswordCriteriaCount <= 2) strengthClass = 'strength-weak';
    else if (metPasswordCriteriaCount === 3) strengthClass = 'strength-medium';
    else strengthClass = 'strength-strong';

    const isPasswordValid = metPasswordCriteriaCount === 4;
    const isConfirmValid = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        setTouched({ ...touched, email: true });

        if (!isEmailValid) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            await forgotPassword(formData.email);
            setStep(2);
            setTimeLeft(300); // 5 mins
            setSuccessMessage(`OTP sent to ${formData.email}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send reset code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        setTouched({ ...touched, otpCode: true, newPassword: true, confirmPassword: true });

        if (!formData.otpCode) {
            setError('Please enter the OTP code.');
            setIsLoading(false);
            return;
        }

        if (!isPasswordValid) {
            setError('Please meet all password requirements.');
            setIsLoading(false);
            return;
        }

        if (!isConfirmValid) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            await resetPassword(
                formData.email,
                formData.otpCode,
                formData.newPassword,
                formData.confirmPassword
            );

            setSuccessMessage('Password successfully reset! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);

        } catch (err) {
            setError(err.response?.data?.detail || 'Password reset failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timeLeft > 0) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await forgotPassword(formData.email);
            setTimeLeft(300);
            setSuccessMessage('A new code has been sent.');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to resend OTP.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="signup-wizard-wrapper">
            <div className="signup-wizard-card">

                {step === 2 && (
                    <button className="wizard-back-btn fade-in-up" onClick={() => { setStep(1); setError(''); setSuccessMessage(''); }} type="button">
                        <ArrowLeft size={18} /> Back
                    </button>
                )}

                <div className="wizard-header fade-in-up">
                    <div className="wizard-logo">
                        <Command size={28} />
                    </div>
                    {step === 1 ? (
                        <>
                            <h1 className="wizard-title">Forgot Password</h1>
                            <p className="wizard-subtitle">We will send you a code to reset your password.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="wizard-title">Reset Password</h1>
                            <p className="wizard-subtitle">
                                Enter the code sent to your email and create a new password.
                            </p>
                        </>
                    )}
                </div>

                {step === 1 && (
                    <form onSubmit={handleRequestOtp} className="form-stack fade-in-up" style={{ animationDelay: '0.1s' }}>

                        {error && (
                            <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <Input
                            id="email"
                            label="Email Address"
                            type="email"
                            placeholder="name@example.com"
                            icon={Mail}
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            error={touched.email && !isEmailValid ? "Please enter a valid email address." : null}
                            autoFocus
                        />

                        <Button type="submit" disabled={isLoading} style={{ marginTop: '1rem', height: '54px', fontSize: '1.05rem' }}>
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Code'}
                        </Button>

                        <div className="login-redirect">
                            Remember your password? <Link to="/login">Sign in</Link>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>

                        {error && (
                            <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
                                <span>⚠</span> {error}
                            </div>
                        )}
                        {successMessage && (
                            <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                                {successMessage}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="form-stack">
                            <Input
                                id="otpCode"
                                label="OTP Code"
                                type="text"
                                placeholder="e.g. 123456"
                                value={formData.otpCode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                autoFocus
                            />

                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '-0.2rem', marginBottom: '0.5rem' }}>
                                {timeLeft > 0 ? (
                                    <span>Code expires in {formatTime(timeLeft)}</span>
                                ) : (
                                    <span style={{ color: 'var(--destructive)' }}>Code expired</span>
                                )}
                            </div>

                            <div>
                                <Input
                                    id="newPassword"
                                    label="New Password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    icon={Lock}
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    error={touched.newPassword && !isPasswordValid ? "Password requirements not met." : null}
                                />

                                {(touched.newPassword || formData.newPassword.length > 0) && !isPasswordValid && (
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

                            <Button type="submit" disabled={isLoading || timeLeft === 0} style={{ marginTop: '0.5rem', height: '54px', fontSize: '1.05rem' }}>
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                            </Button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Forgot;
