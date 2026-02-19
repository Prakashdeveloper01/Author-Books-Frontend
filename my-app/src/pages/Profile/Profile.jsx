import React, { useState, useEffect } from 'react';
import {
    Edit2, Edit3, MapPin, Link as LinkIcon, Calendar, BookOpen,
    Download, Check, Loader2, Mail, Shield, Save, X, Star, TrendingUp, Zap, Award, User, Activity,
    Library, MessageSquare
} from 'lucide-react';
import { getProfile, getDashboard, listBooks } from '../../services/api';
import './Profile.css';

const ActivityIcon = ({ type }) => {
    switch (type) {
        case 'PUBLISH': return <BookOpen size={20} />;
        case 'REVIEW': return <Star size={20} />;
        case 'DOWNLOAD': return <Download size={20} />;
        case 'UPDATE': return <Edit2 size={20} />;
        default: return <Activity size={20} />;
    }
};

const Profile = ({ role }) => {
    const isAuthor = role === 'author';
    const [user, setUser] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [editDraft, setEditDraft] = useState({});

    useEffect(() => {
        const load = async () => {
            try {
                const [prof, dash, allBooks] = await Promise.all([
                    getProfile(),
                    getDashboard(),
                    isAuthor ? listBooks() : Promise.resolve({ data: [] })
                ]);

                if (prof.status === '1') {
                    setUser(prof.data);
                    setEditDraft({
                        tagline: prof.data.tagline || '',
                        bio: prof.data.bio || '',
                        location: prof.data.location || '',
                        website: prof.data.website || ''
                    });
                }
                if (dash.status === '1') setDashboardData(dash.data);
                if (allBooks.status === '1') setBooks(allBooks.data);
            } catch (err) {
                console.error('Profile Load Error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isAuthor]);

    const handleSave = () => {
        setUser({ ...user, ...editDraft });
        setIsEditing(false);
    };

    if (loading || !user) return (
        <div className="profile-loading">
            <Loader2 className="spin" size={40} />
            <p>Gathering your studio...</p>
        </div>
    );

    const stats = dashboardData?.stats || {};
    const statsArray = isAuthor ? [
        { label: 'Published', value: stats.totalBooks || 0, icon: <BookOpen size={18} /> },
        { label: 'Downloads', value: stats.totalDownloads || 0, icon: <Download size={18} /> },
        { label: 'Rating', value: stats.averageRating ? Number(stats.averageRating).toFixed(1) : '—', icon: <Star size={18} /> }
    ] : [
        { label: 'Books Read', value: stats.booksDownloaded || 0, icon: <Zap size={18} /> },
        { label: 'Points', value: stats.totalReviewsGiven || 0, icon: <MessageSquare size={18} /> },
        { label: 'Rank', value: stats.rank || 'Bronze', icon: <Award size={18} /> }
    ];

    return (
        <div className={`profile-wrapper-studio ${isAuthor ? 'author-mode' : 'reader-mode'}`}>

            {/* ── STUDIO HEADER (BANNER) ── */}
            <header className="studio-banner">
                <div className="banner-overlay" />
            </header>

            <div className="studio-main-grid">

                {/* ── LEFT: IDENTITY SIDEBAR ── */}
                <aside className="studio-sidebar">
                    <div className="studio-profile-card">
                        <div className="studio-avatar-box">
                            {user.username[0].toUpperCase()}
                        </div>

                        <div className="studio-identity-text">
                            <span className="studio-role-pill">{role}</span>
                            <h1 className="studio-username">{user.username}</h1>
                            <p className="studio-tagline">{user.tagline || (isAuthor ? 'Exclusive Author' : 'Avid Reader')}</p>
                        </div>

                        <div className="studio-stats-vertical">
                            {statsArray.map(s => (
                                <div key={s.label} className="studio-stat-item">
                                    <div className="stat-icon-s">{s.icon}</div>
                                    <div className="stat-info-s">
                                        <span className="stat-val-s">{s.value}</span>
                                        <span className="stat-lab-s">{s.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="studio-meta-list">
                            {user.location && <div className="meta-item"><MapPin size={14} /> {user.location}</div>}
                            {user.website && <div className="meta-item"><LinkIcon size={14} /> {user.website}</div>}
                            <div className="meta-item"><Calendar size={14} /> Joined {user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}</div>
                        </div>

                        <div className="studio-actions">
                            <button className={`studio-btn-primary ${isEditing ? 'saving' : ''}`} onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                                {isEditing ? <><Save size={16} /> Update Details</> : <><Edit3 size={16} /> Edit Profile</>}
                            </button>
                            {isEditing && (
                                <button className="studio-btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── RIGHT: CONTENT WORKSPACE ── */}
                <main className="studio-workspace">
                    <nav className="studio-tabs">
                        <button className={`studio-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Activity Feed</button>
                        <button className={`studio-tab ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}>{isAuthor ? 'Portfolio' : 'Library'}</button>
                        <button className={`studio-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>Professional Bio</button>
                    </nav>

                    <div className="studio-scroll-area">
                        {activeTab === 'overview' && (
                            <div className="studio-content-section fade-in">
                                <h2 className="section-title">Recent Studio Activity</h2>
                                {dashboardData?.recentActivity?.length > 0 ? (
                                    <div className="activity-stack">
                                        {dashboardData.recentActivity.map(act => (
                                            <div key={act.id} className="studio-activity-card">
                                                <div className="act-type-icon"><ActivityIcon type={act.type} /></div>
                                                <div className="act-body">
                                                    <p className="act-title">{act.title}</p>
                                                    <span className="act-time">{act.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="studio-empty">No workspace activity recorded.</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'works' && (
                            <div className="studio-content-section fade-in">
                                <h2 className="section-title">{isAuthor ? 'Creative Portfolio' : 'Your Collection'}</h2>
                                <div className="studio-grid-works">
                                    {(isAuthor ? books : []).length > 0 ? books.map(b => (
                                        <div key={b.uuid} className="studio-work-card">
                                            <div className="work-icon-box"><BookOpen size={20} /></div>
                                            <div className="work-meta">
                                                <p className="work-title">{b.title}</p>
                                                <span className={`work-status ${b.status === 1 ? 'pub' : 'draft'}`}>
                                                    {b.status === 1 ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="studio-empty">Begin your creative journey by adding a title.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="studio-content-section fade-in">
                                <h2 className="section-title">Biography</h2>
                                {isEditing ? (
                                    <div className="studio-edit-wrap">
                                        <label>Headline</label>
                                        <input className="studio-input" value={editDraft.tagline} onChange={e => setEditDraft({ ...editDraft, tagline: e.target.value })} />
                                        <label>Introduction</label>
                                        <textarea className="studio-textarea" rows={6} value={editDraft.bio} onChange={e => setEditDraft({ ...editDraft, bio: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="studio-bio-content">
                                        <p className="studio-bio-text">{user.bio || 'This professional has not defined their journey yet.'}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
