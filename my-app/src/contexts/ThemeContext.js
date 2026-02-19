import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

/* ─── accent colour helpers ─── */
const ACCENT_KEY = 'appAccentColor';
const DEFAULT_ACCENT_LIGHT = '#635bff';
const DEFAULT_ACCENT_DARK = '#818cf8';

/** Inject/update a dedicated <style id="accent-vars"> tag so the
 *  accent colour survives data-theme switches (stylesheet rules cannot
 *  override an inline <style> that lives at the :root level). */
function injectAccentStyle(hex) {
    const id = 'accent-vars';
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('style');
        el.id = id;
        document.head.appendChild(el);
    }
    // Derive an alpha version for --primary-light
    // We use a transparent rgba fallback that any browser supports
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    el.textContent = `
        :root,
        [data-theme="light"], .light,
        [data-theme="dark"],  .dark {
            --primary:       ${hex} !important;
            --primary-hover: ${shadeHex(hex, -20)} !important;
            --primary-light: rgba(${r},${g},${b},0.12) !important;
            --border-focus:  ${hex} !important;
            --shadow-input-focus: 0 0 0 4px rgba(${r},${g},${b},0.18) !important;
            --sidebar-active-bg:    rgba(${r},${g},${b},0.15) !important;
            --sidebar-active-color: ${hex} !important;
            --shadow-card: 0 0 0 1px rgba(0,0,0,0.04), 0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 40px -15px rgba(${r},${g},${b},0.12) !important;
        }
    `;
}

/** Simple hex darkener (negative amount) / lightener (positive) */
function shadeHex(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function removeAccentStyle() {
    const el = document.getElementById('accent-vars');
    if (el) el.remove();
}

export function applyAccentColor(hex) {
    if (!hex) { removeAccentStyle(); return; }
    localStorage.setItem(ACCENT_KEY, hex);
    injectAccentStyle(hex);
}

/* ─── theme helpers ─── */
const getInitialTheme = () => {
    const stored = localStorage.getItem('app-theme');
    if (stored) return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme, animate = false) => {
    const root = document.documentElement;
    if (animate) {
        root.classList.add('theme-transitioning');
        setTimeout(() => root.classList.remove('theme-transitioning'), 300);
    }
    root.setAttribute('data-theme', theme);
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    document.body.setAttribute('data-theme', theme);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('app-theme', theme);

    // Re-inject accent after theme switch (theme CSS would otherwise win)
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    if (savedAccent) injectAccentStyle(savedAccent);
};

// Apply immediately on load (no animation — prevents flash)
applyTheme(getInitialTheme(), false);

/* ─── provider ─── */
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'light' ? 'dark' : 'light';
            applyTheme(next, true);
            return next;
        });
    }, []);

    useEffect(() => {
        applyTheme(theme, false);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};
