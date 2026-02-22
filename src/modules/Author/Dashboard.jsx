import { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Download, Star, User, Activity, ArrowRight, Zap, TrendingUp, Pen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, listBooks, getProfile } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import './Dashboard.css';

const AuthorDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [recentBooks, setRecentBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, dashRes, booksRes] = await Promise.all([
                    getProfile(),
                    getDashboard(),
                    listBooks()
                ]);

                if (profileRes.status === '1') setUser(profileRes.data);
                if (dashRes.status === '1' && dashRes.data?.stats) setStats(dashRes.data.stats);
                if (booksRes.status === '1') setRecentBooks(booksRes.data?.slice(0, 4) || []);
            } catch (e) {
                console.error('Dashboard load failed:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, colorVar, bgVar }) => (
        <div className="stat-card-author">
            <div className="stat-card-header">
                <span className="stat-card-label">{title}</span>
                <div className="stat-icon-box" style={{ background: `var(${bgVar})` }}>
                    <Icon size={20} color={`var(${colorVar})`} />
                </div>
            </div>
            <div>
                <div className="stat-card-value">
                    {isLoading ? '—' : (value ?? 0)}
                </div>
            </div>
            <div className="stat-bg-icon">
                <Icon size={80} color={`var(${colorVar})`} />
            </div>
        </div>
    );

    const displayName = user?.username || user?.email?.split('@')[0] || 'Author';

    return (
        <DashboardLayout role="author">
            <div className="author-dashboard">

                {/* Hero */}
                <div className="author-hero">
                    <div className="hero-content-inner">
                        <h1>
                            {isLoading
                                ? 'Welcome back!'
                                : `Welcome back, ${displayName}`}
                        </h1>
                        <p>Your command center for creating, publishing and tracking your work.</p>
                        <div className="hero-actions">
                            <button className="hero-btn-primary" onClick={() => navigate('/author/books/new')}>
                                <PlusCircle size={18} /> New Book
                            </button>
                            <button className="hero-btn-ghost" onClick={() => navigate('/author/books')}>
                                View Library
                            </button>
                        </div>
                    </div>
                    <div className="hero-orb-1" />
                    <div className="hero-orb-2" />
                </div>

                {/* Analytics */}
                <div className="analytics-section">
                    <div className="analytics-header">
                        <h2>Performance Overview</h2>
                    </div>

                    {isLoading ? (
                        <div className="stats-grid-author">
                            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-stat" />)}
                        </div>
                    ) : (
                        <div className="stats-grid-author">
                            <StatCard
                                title="Total Books"
                                value={stats?.totalBooks}
                                icon={BookOpen}
                                colorVar="--stat-blue"
                                bgVar="--stat-blue-bg"
                            />
                            <StatCard
                                title="Total Downloads"
                                value={stats?.totalDownloads}
                                icon={Download}
                                colorVar="--stat-green"
                                bgVar="--stat-green-bg"
                            />
                            <StatCard
                                title="Reviews Received"
                                value={stats?.totalReviewsReceived}
                                icon={User}
                                colorVar="--stat-amber"
                                bgVar="--stat-amber-bg"
                            />
                            <StatCard
                                title="Avg. Rating"
                                value={stats?.averageRating ? Number(stats.averageRating).toFixed(1) : '—'}
                                icon={Star}
                                colorVar="--stat-purple"
                                bgVar="--stat-purple-bg"
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Grid */}
                <div className="bottom-grid">

                    {/* Recent Projects */}
                    <div className="panel">
                        <div className="panel-header">
                            <h2 className="panel-title"><Activity size={18} /> Recent Projects</h2>
                            <button className="panel-link" onClick={() => navigate('/author/books')}>
                                View All <ArrowRight size={15} />
                            </button>
                        </div>

                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="book-row-skeleton" />)
                        ) : recentBooks.length > 0 ? (
                            recentBooks.map(book => (
                                <div key={book.uuid} className="book-row" onClick={() => navigate(`/author/books/${book.uuid}`)}>
                                    <div className="book-row-thumb">
                                        <BookOpen size={18} />
                                    </div>
                                    <div className="book-row-info">
                                        <div className="book-row-title">{book.title}</div>
                                        <div className="book-row-date">
                                            Updated{' '}
                                            {book.updated_at
                                                ? new Date(book.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                : '—'
                                            }
                                        </div>
                                    </div>
                                    <span className={`book-status-pill ${book.status === 1 ? 'published' : 'draft'}`}>
                                        {book.status === 1 ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-recent">
                                <Pen size={28} />
                                <p>No books yet.</p>
                                <button className="empty-cta" onClick={() => navigate('/author/books/new')}>
                                    Create your first book
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar quick actions */}
                    <div className="sidebar-cards">
                        <div className="pro-tip-card">
                            <h3><Zap size={16} /> Quick Stats</h3>
                            <div className="quick-stat-row">
                                <span>Published</span>
                                <strong>{stats?.publishedBooks ?? '—'}</strong>
                            </div>
                            <div className="quick-stat-row">
                                <span>Drafts</span>
                                <strong>{stats?.draftBooks ?? '—'}</strong>
                            </div>
                            <div className="quick-stat-row">
                                <span>Reviews</span>
                                <strong>{stats?.totalReviewsReceived ?? '—'}</strong>
                            </div>
                        </div>

                        <div className="writing-prompt-card">
                            <h3><TrendingUp size={17} /> Get Started</h3>
                            <p>Start a new project and grow your reader base.</p>
                            <Button onClick={() => navigate('/author/books/new')}>
                                <PlusCircle size={15} style={{ marginRight: 6 }} /> Create New Book
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default AuthorDashboard;
