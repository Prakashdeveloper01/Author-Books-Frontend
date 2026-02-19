import React, { useState, useEffect } from 'react';
import {
    Palette, Lock, Bell, LayoutGrid, AlertTriangle,
    Sun, Moon, Monitor, Check, Eye, EyeOff, Loader2,
    LogOut, Trash2, CheckCircle, XCircle, Type
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { applyAccentColor } from '../../contexts/ThemeContext';
import { getProfile } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

/* ────────────────────────────────────────────────────────────
   STORAGE & DEFAULTS
──────────────────────────────────────────────────────────── */
const SETTINGS_KEY = 'appSettings_v1';
const ACCENT_KEY = 'appAccentColor';

const defaultSettings = {
    fontSize: 'medium',
    accentColor: '#635bff',
    notifyOnReview: true,
    notifyOnDownload: false,
    weeklyDigest: false,
    defaultView: 'grid',
    dateFormat: 'MMM D, YYYY',
    defaultBookStatus: 'draft',
};

function loadSettings() {
    try {
        const s = localStorage.getItem(SETTINGS_KEY);
        return s ? { ...defaultSettings, ...JSON.parse(s) } : { ...defaultSettings };
    } catch { return { ...defaultSettings }; }
}

function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

/* ────────────────────────────────────────────────────────────
   ACCENT PALETTE
──────────────────────────────────────────────────────────── */
const ACCENTS = [
    { label: 'Indigo', value: '#635bff' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Pink', value: '#ec4899' },
];

/* ────────────────────────────────────────────────────────────
   FONT SIZE
──────────────────────────────────────────────────────────── */
function applyFontSize(size) {
    const map = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font-size', map[size] || '16px');
    document.documentElement.style.fontSize = map[size] || '16px';
}

/* ────────────────────────────────────────────────────────────
   PASSWORD STRENGTH
──────────────────────────────────────────────────────────── */
function getStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '', width: '0%' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
        { label: '', color: 'transparent', width: '0%' },
        { label: 'Weak', color: '#f43f5e', width: '25%' },
        { label: 'Fair', color: '#f59e0b', width: '50%' },
        { label: 'Good', color: '#3b82f6', width: '75%' },
        { label: 'Strong', color: '#10b981', width: '100%' },
    ];
    return map[score];
}

/* ────────────────────────────────────────────────────────────
   NAV SECTIONS
──────────────────────────────────────────────────────────── */
const SECTIONS = [
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'account', icon: Lock, label: 'Account & Security' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'preferences', icon: LayoutGrid, label: 'Preferences' },
    { id: 'danger', icon: AlertTriangle, label: 'Danger Zone', danger: true },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────────────────────── */
const Settings = ({ role }) => {
    const { theme, toggleTheme, isDark } = useTheme();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [activeSection, setActiveSection] = useState('appearance');
    const [settings, setSettings] = useState(loadSettings);

    /* Password form */
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const [pwStatus, setPwStatus] = useState(null);
    const [pwLoading, setPwLoading] = useState(false);

    /* Delete confirm */
    const [deleteInput, setDeleteInput] = useState('');

    useEffect(() => {
        getProfile().then(r => { if (r.status === '1') setUser(r.data); }).catch(() => { });
        // Re-apply saved accent on mount
        const saved = localStorage.getItem(ACCENT_KEY);
        if (saved) applyAccentColor(saved);
    }, []);

    useEffect(() => {
        applyFontSize(settings.fontSize);
    }, [settings.fontSize]);

    const update = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        saveSettings(next);
        if (key === 'accentColor') applyAccentColor(value);
        if (key === 'fontSize') applyFontSize(value);
    };

    const handleThemeCard = (val) => {
        update('theme', val === 'system' ? 'system' : val);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (val === 'system') {
            if ((prefersDark && !isDark) || (!prefersDark && isDark)) toggleTheme();
        } else {
            if ((val === 'dark' && !isDark) || (val === 'light' && isDark)) toggleTheme();
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!pwForm.current) { setPwStatus({ type: 'error', msg: 'Enter your current password.' }); return; }
        if (pwForm.newPw.length < 8) { setPwStatus({ type: 'error', msg: 'New password must be at least 8 characters.' }); return; }
        if (pwForm.newPw !== pwForm.confirm) { setPwStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
        setPwLoading(true);
        try {
            const res = await fetch('http://localhost:7999/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
            });
            if (res.ok) {
                setPwStatus({ type: 'success', msg: 'Password updated successfully.' });
                setPwForm({ current: '', newPw: '', confirm: '' });
            } else {
                const data = await res.json().catch(() => ({}));
                setPwStatus({ type: 'error', msg: data.detail || 'Current password is incorrect.' });
            }
        } catch {
            setPwStatus({ type: 'error', msg: 'Unable to reach server. Try again.' });
        } finally {
            setPwLoading(false);
            setTimeout(() => setPwStatus(null), 5000);
        }
    };

    const handleLogout = () => {
        ['token', 'refreshToken', 'userType', 'userProfile'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
    };

    const getInitials = (n) => n ? n.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) : '?';
    const strength = getStrength(pwForm.newPw);

    /* ── Appearance ─────────────────────────────── */
    const renderAppearance = () => (
        <>
            <div className="settings-card">
                <div className="settings-card-title">Theme</div>
                <div className="s-pad" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="theme-options">
                        {[
                            { val: 'light', label: 'Light' },
                            { val: 'dark', label: 'Dark' },
                            { val: 'system', label: 'System' },
                        ].map(({ val, label }) => (
                            <div
                                key={val}
                                className={`theme-card ${val}-card ${settings.theme === val ? 'active' : ''}`}
                                onClick={() => handleThemeCard(val)}
                                role="button" tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && handleThemeCard(val)}
                            >
                                <div className="theme-card-preview">
                                    <div className="theme-mini-sidebar" />
                                    <div className="theme-mini-content">
                                        <div className="theme-mini-bar" />
                                        <div className="theme-mini-bar" />
                                        <div className="theme-mini-bar" />
                                    </div>
                                </div>
                                <div className="theme-card-label">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="setting-row setting-row--wrap">
                    <div className="setting-row-left">
                        <div className="setting-row-label">
                            <Type size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                            Font Size
                        </div>
                        <div className="setting-row-desc">Affects text size across all pages</div>
                    </div>
                    <div className="pill-group">
                        {[['small', 'S'], ['medium', 'M'], ['large', 'L']].map(([v, l]) => (
                            <button type="button" key={v} className={`pill-option ${settings.fontSize === v ? 'active' : ''}`} onClick={() => update('fontSize', v)}>{l}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <div className="settings-card-title">Accent Colour</div>
                <div className="setting-row setting-row--wrap">
                    <div className="setting-row-left">
                        <div className="setting-row-label">Primary colour</div>
                        <div className="setting-row-desc">Applied to buttons, highlights and active states across the whole app — including after theme switches</div>
                    </div>
                    <div className="accent-swatches">
                        {ACCENTS.map(a => (
                            <button
                                type="button"
                                key={a.value}
                                className={`accent-swatch ${settings.accentColor === a.value ? 'active' : ''}`}
                                style={{ background: a.value }}
                                title={a.label}
                                onClick={() => update('accentColor', a.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    /* ── Account ─────────────────────────────────── */
    const renderAccount = () => (
        <>
            <div className="settings-card">
                <div className="settings-card-title">Your Account</div>
                {user && (
                    <div className="account-info-display">
                        <div className="account-info-avatar">{getInitials(user.username)}</div>
                        <div>
                            <div className="account-info-name">{user.username}</div>
                            <div className="account-info-meta">
                                {user.email && <span>{user.email}</span>}
                                <span className="account-type-chip">{user.type}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="settings-field-group">
                    <label className="settings-field-label">Username</label>
                    <input className="settings-field" value={user?.username || ''} readOnly disabled />
                </div>
                <div className="settings-field-group" style={{ borderBottom: 'none' }}>
                    <label className="settings-field-label">Email</label>
                    <input className="settings-field" value={user?.email || ''} readOnly disabled />
                </div>
            </div>

            <div className="settings-card">
                <div className="settings-card-title">Change Password</div>
                <form onSubmit={handleChangePassword}>
                    {pwStatus && (
                        <div className={`settings-feedback ${pwStatus.type}`}>
                            {pwStatus.type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
                            {pwStatus.msg}
                        </div>
                    )}

                    {[
                        { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
                        { key: 'newPw', label: 'New Password', placeholder: 'Minimum 8 characters' },
                        { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
                    ].map(({ key, label, placeholder }) => (
                        <div className="settings-field-group" key={key}>
                            <label className="settings-field-label">{label}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="settings-field"
                                    type={showPw[key] ? 'text' : 'password'}
                                    value={pwForm[key]}
                                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                                    placeholder={placeholder}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                                    className="pw-eye-btn"
                                >
                                    {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {key === 'newPw' && pwForm.newPw && (
                                <>
                                    <div className="strength-bar-wrap">
                                        <div className="strength-bar" style={{ width: strength.width, background: strength.color }} />
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: strength.color, marginTop: 4, fontWeight: 600 }}>{strength.label}</div>
                                </>
                            )}
                            {key === 'confirm' && pwForm.confirm && pwForm.newPw && (
                                <div style={{ fontSize: '0.74rem', marginTop: 4, fontWeight: 600, color: pwForm.confirm === pwForm.newPw ? '#10b981' : '#f43f5e' }}>
                                    {pwForm.confirm === pwForm.newPw ? '✓ Passwords match' : '✗ Do not match'}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="settings-btn-row">
                        <button type="submit" className="settings-btn primary" disabled={pwLoading}>
                            {pwLoading ? <Loader2 size={15} className="spin-icon" /> : <Check size={15} />}
                            {pwLoading ? 'Updating…' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );

    /* ── Notifications ───────────────────────────── */
    const renderNotifications = () => (
        <div className="settings-card">
            <div className="settings-card-title">Email Notifications</div>
            {[
                {
                    key: 'notifyOnReview',
                    label: 'New review received',
                    desc: role === 'author' ? 'Get notified when a reader leaves a review on your book' : 'Get notified about responses to your reviews',
                },
                {
                    key: 'notifyOnDownload',
                    label: role === 'author' ? 'Book downloaded' : 'New book available',
                    desc: role === 'author' ? 'Get notified when someone downloads your book' : 'Be notified when new books are added to the library',
                },
                {
                    key: 'weeklyDigest',
                    label: 'Weekly digest',
                    desc: 'A weekly summary of your activity and performance',
                },
            ].map(({ key, label, desc }) => (
                <div className="setting-row" key={key}>
                    <div className="setting-row-left">
                        <div className="setting-row-label">{label}</div>
                        <div className="setting-row-desc">{desc}</div>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={settings[key]} onChange={() => update(key, !settings[key])} />
                        <span className="toggle-track" />
                    </label>
                </div>
            ))}
        </div>
    );

    /* ── Preferences ─────────────────────────────── */
    const renderPreferences = () => (
        <>
            <div className="settings-card">
                <div className="settings-card-title">Display</div>
                <div className="setting-row setting-row--wrap">
                    <div className="setting-row-left">
                        <div className="setting-row-label">Default book view</div>
                        <div className="setting-row-desc">How books are displayed in the library</div>
                    </div>
                    <div className="pill-group">
                        {[['grid', 'Grid'], ['list', 'List']].map(([v, l]) => (
                            <button type="button" key={v} className={`pill-option ${settings.defaultView === v ? 'active' : ''}`} onClick={() => update('defaultView', v)}>{l}</button>
                        ))}
                    </div>
                </div>
                <div className="setting-row setting-row--wrap">
                    <div className="setting-row-left">
                        <div className="setting-row-label">Date format</div>
                        <div className="setting-row-desc">How dates appear throughout the app</div>
                    </div>
                    <div className="pill-group">
                        {[['MMM D, YYYY', 'Feb 19'], ['DD/MM/YYYY', 'DD/MM'], ['MM/DD/YYYY', 'MM/DD']].map(([v, l]) => (
                            <button type="button" key={v} className={`pill-option ${settings.dateFormat === v ? 'active' : ''}`} onClick={() => update('dateFormat', v)}>{l}</button>
                        ))}
                    </div>
                </div>
            </div>

            {role === 'author' && (
                <div className="settings-card">
                    <div className="settings-card-title">Author Preferences</div>
                    <div className="setting-row setting-row--wrap">
                        <div className="setting-row-left">
                            <div className="setting-row-label">Default new book status</div>
                            <div className="setting-row-desc">When you create a book, start it as a draft or publish immediately</div>
                        </div>
                        <div className="pill-group">
                            {[['draft', 'Draft'], ['published', 'Published']].map(([v, l]) => (
                                <button type="button" key={v} className={`pill-option ${settings.defaultBookStatus === v ? 'active' : ''}`} onClick={() => update('defaultBookStatus', v)}>{l}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    /* ── Danger Zone ─────────────────────────────── */
    const renderDanger = () => (
        <div className="danger-zone-card">
            <div className="danger-zone-title">⚠️ Danger Zone</div>
            <div className="setting-row">
                <div className="setting-row-left">
                    <div className="setting-row-label">Sign out</div>
                    <div className="setting-row-desc">End your current session and return to login</div>
                </div>
                <button type="button" className="settings-btn secondary" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                </button>
            </div>
            <div className="setting-row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div className="setting-row-left">
                    <div className="setting-row-label" style={{ color: 'var(--destructive)' }}>Delete account</div>
                    <div className="setting-row-desc">
                        Permanently deletes your account and all data. This cannot be undone.<br />
                        Type <strong>DELETE</strong> below to confirm.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        className="settings-field"
                        placeholder="Type DELETE"
                        value={deleteInput}
                        onChange={e => setDeleteInput(e.target.value)}
                        style={{ maxWidth: '140px', minWidth: '120px' }}
                    />
                    <button
                        type="button"
                        className="settings-btn danger"
                        disabled={deleteInput !== 'DELETE'}
                        onClick={() => alert('Account deletion requires backend implementation.')}
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const sectionMap = {
        appearance: renderAppearance,
        account: renderAccount,
        notifications: renderNotifications,
        preferences: renderPreferences,
        danger: renderDanger,
    };

    const sectionDescriptions = {
        appearance: 'Customise how the application looks and feels.',
        account: 'Manage your account credentials and security.',
        notifications: 'Control what emails and alerts you receive.',
        preferences: 'Personalise your default experience across the app.',
        danger: 'Irreversible actions — proceed with caution.',
    };

    const currentSection = SECTIONS.find(s => s.id === activeSection);

    return (
        <div className="settings-page main-container">
            {/* ── Sidebar nav ── */}
            <nav className="settings-nav" aria-label="Settings navigation">
                {SECTIONS.map((s, i) => (
                    <React.Fragment key={s.id}>
                        {i === SECTIONS.length - 1 && <div className="settings-nav-sep" />}
                        <button
                            type="button"
                            className={`settings-nav-item ${activeSection === s.id ? 'active' : ''} ${s.danger ? 'danger' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            <s.icon size={16} />
                            <span>{s.label}</span>
                        </button>
                    </React.Fragment>
                ))}
            </nav>

            {/* ── Content ── */}
            <div className="settings-content">
                <div className="settings-section-header">
                    <h2>{currentSection?.label}</h2>
                    <p>{sectionDescriptions[activeSection]}</p>
                </div>
                {sectionMap[activeSection]?.()}
            </div>
        </div>
    );
};

export default Settings;
