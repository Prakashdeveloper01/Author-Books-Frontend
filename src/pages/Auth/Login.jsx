import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Command } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { login, getProfile } from '../../services/api';
import './Auth.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await login(username, password);
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            localStorage.setItem('userType', response.userType);

            try {
                const profile = await getProfile();
                localStorage.setItem('userProfile', JSON.stringify(profile));
            } catch (profileError) { console.warn(profileError); }

            if (response.userType === 'author') {
                navigate('/author-dashboard');
            } else {
                navigate('/reader-dashboard');
            }

        } catch (err) {
            console.error(err);
            setError('Incorrect email or password.');
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
                    <h1 className="auth-title">Sign in to your account</h1>
                    <p className="auth-subtitle">
                        Welcome back! Please enter your details.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="form-stack">
                    {error && (
                        <div className="auth-error-banner">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <Input
                        id="username"
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                    <div style={{ position: 'relative' }}>
                        <Input
                            id="password"
                            label={
                                <>
                                    Password
                                    <Link to="/forgot-password" tabIndex="-1" style={{ fontSize: '0.8rem', color: '#635bff', fontWeight: 500 }}>Forgot Password?</Link>
                                </>
                            }
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                    </Button>
                </form>

                <div className="auth-footer">
                    Don't have an account?
                    <Link to="/signup" className="auth-link" style={{ marginLeft: '0.5rem' }}>Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
