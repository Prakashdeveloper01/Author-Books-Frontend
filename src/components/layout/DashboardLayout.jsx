import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, LayoutDashboard, Settings, ChevronDown, Sun, Moon, Library, Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { logoutUser } from '../../services/api';
import './DashboardLayout.css';

const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
        <Icon size={18} />
        <span>{label}</span>
    </Link>
);

const DashboardLayout = ({ children, role = 'reader' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme, isDark } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState({ username: null, email: null });
    const dropdownRef = useRef(null);

    // Close sidebar on route change
    useEffect(() => { setIsSidebarOpen(false); }, [location.pathname]);

    useEffect(() => {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            try {
                setUser(JSON.parse(storedProfile));
            } catch (e) {
                console.error('Failed to parse user profile', e);
            }
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (e) {
            console.warn('Logout API failed', e);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('userProfile');
            navigate('/login');
        }
    };

    const authorLinks = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/author-dashboard' },
        { icon: BookOpen, label: 'My Books', to: '/author/books' },
    ];

    const readerLinks = [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/reader-dashboard' },
        { icon: BookOpen, label: 'All Books', to: '/reader/books' },
        { icon: Library, label: 'My Library', to: '/reader/library' },
    ];

    const settingsTo = role === 'author' ? '/author/settings' : '/reader/settings';

    const links = role === 'author' ? authorLinks : readerLinks;

    // Improved title detection
    let currentPageLabel = 'Dashboard';
    const activeLink = links.find(l => l.to === location.pathname);
    if (activeLink) {
        currentPageLabel = activeLink.label;
    } else if (location.pathname.includes('/settings')) {
        currentPageLabel = 'Settings';
    } else if (location.pathname.includes('/profile')) {
        currentPageLabel = 'Profile';
    }

    return (
        <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}
            {/* ===== SIDEBAR ===== */}
            <aside className={`sidebar ${isSidebarOpen ? 'sidebar-mobile-visible' : ''}`}>
                <div className="sidebar-header">
                    <BookOpen className="brand-icon" size={26} />
                    <h1 className="brand-name">Athenaeum</h1>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Navigation</div>
                    {links.map((link) => (
                        <SidebarItem
                            key={link.to}
                            icon={link.icon}
                            label={link.label}
                            to={link.to}
                            active={location.pathname === link.to}
                        />
                    ))}
                </nav>

                {/* Sidebar bottom user card */}
                <div className="sidebar-user-area">
                    <div className="sidebar-user-card">
                        <div className="sidebar-user-avatar">
                            {user?.username ? user.username[0].toUpperCase() : 'U'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sidebar-user-name">{user?.username || 'User'}</div>
                            <div className="sidebar-user-role">{role}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main className="main-content">
                {/* ===== TOP BAR ===== */}
                <header className="top-bar">
                    {/* Hamburger - mobile only */}
                    <button
                        className="hamburger-btn"
                        onClick={() => setIsSidebarOpen(s => !s)}
                        aria-label="Toggle navigation"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <h2 className="page-title">{currentPageLabel}</h2>

                    <div className="top-bar-actions">
                        {/* User Menu */}
                        <div className="user-menu-container" ref={dropdownRef}>
                            <div
                                className="user-menu-trigger"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="user-info">
                                    <span className="user-name">{user?.username || 'User'}</span>
                                    <span className="user-role">{role}</span>
                                </div>
                                <div className="user-avatar">
                                    {user?.username ? user.username[0].toUpperCase() : <User size={18} />}
                                </div>
                                <ChevronDown size={15} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                            </div>

                            {isDropdownOpen && (
                                <div className="user-dropdown">
                                    <div className="dropdown-header-info">
                                        <p className="dropdown-name">{user?.username}</p>
                                        {user?.email && <p className="dropdown-email">{user.email}</p>}
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link
                                        to={`/${role}/profile`}
                                        className="dropdown-item"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <User size={15} /> Profile
                                    </Link>
                                    <Link
                                        to={settingsTo}
                                        className="dropdown-item"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <Settings size={15} /> Settings
                                    </Link>
                                    <div className="dropdown-item theme-toggle-row" onClick={toggleTheme}>
                                        {isDark ? <Moon size={15} /> : <Sun size={15} />}
                                        {isDark ? 'Light Mode' : 'Dark Mode'}
                                        <span className="dropdown-theme-badge">
                                            {isDark ? '☀️' : '🌙'}
                                        </span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleLogout} className="dropdown-item logout-item">
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="content-area">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
