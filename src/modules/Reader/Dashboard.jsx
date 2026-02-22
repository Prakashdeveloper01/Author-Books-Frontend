import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Heart, Download, Star, Compass, Info, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { listBooks, downloadBookFile, createReview, listReviews, updateReview, getProfile } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './Dashboard.css';

const ReaderDashboard = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [userReviews, setUserReviews] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeGenre, setActiveGenre] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const recentBooks = books.slice(0, 4);
    const genres = ['All', ...new Set(books.map(b => b.genre).filter(Boolean))];

    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profile = await getProfile();
                const [booksRes, reviewsRes] = await Promise.all([
                    listBooks({ status: 1 }),
                    listReviews({ reviewer_id: profile.id })
                ]);

                if (booksRes.status === '1') {
                    setBooks(booksRes.data || []);
                    setFilteredBooks(booksRes.data || []);
                }

                const reviewsMap = {};
                if (reviewsRes?.data) {
                    reviewsRes.data.forEach(r => { reviewsMap[r.bookId] = r; });
                }
                setUserReviews(reviewsMap);
            } catch (err) {
                console.error('Dashboard load failed:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let result = books;
        if (activeGenre !== 'All') result = result.filter(b => b.genre === activeGenre);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.title.toLowerCase().includes(q) ||
                (b.author_name && b.author_name.toLowerCase().includes(q))
            );
        }
        setFilteredBooks(result);
    }, [activeGenre, searchQuery, books]);

    const handleDownload = async (e, bookUuid, title) => {
        e.stopPropagation();
        try {
            const response = await downloadBookFile(bookUuid, '1');
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            addToast('Failed to download book.', 'error');
        }
    };

    const openReviewModal = (e, book) => {
        e.stopPropagation();
        setSelectedBook(book);
        const existing = userReviews[book.bookId];
        setReviewRating(existing ? existing.rating : 5);
        setReviewComment(existing ? existing.comment : '');
        setIsReviewOpen(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setIsSubmittingReview(true);
        try {
            const existing = userReviews[selectedBook.bookId];
            if (existing) {
                await updateReview(existing.id, { rating: reviewRating, comment: reviewComment });
                setUserReviews(prev => ({ ...prev, [selectedBook.bookId]: { ...existing, rating: reviewRating, comment: reviewComment } }));
                addToast('Review updated successfully!', 'success');
            } else {
                const newReview = await createReview({ bookId: selectedBook.bookId, rating: reviewRating, comment: reviewComment });
                setUserReviews(prev => ({ ...prev, [selectedBook.bookId]: { id: newReview.id || Date.now(), bookId: selectedBook.bookId, rating: reviewRating, comment: reviewComment } }));
                addToast('Review submitted successfully!', 'success');
            }
            setIsReviewOpen(false);
        } catch (err) {
            addToast(err.response?.data?.detail || 'Failed to process review.', 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Dynamic pastel cover color per book (works on both themes)
    const getCoverStyle = (title) => ({
        background: `hsl(${title.length * 15}, 55%, 75%)`,
    });

    return (
        <DashboardLayout role="reader">
            <div className="reader-dashboard">

                {/* Header: Search + Genre Pills */}
                <div className="dashboard-header">
                    <div className="search-container">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Find your next story..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="genre-scroll">
                        {genres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => setActiveGenre(genre)}
                                className={`genre-pill ${activeGenre === genre ? 'active' : ''}`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="dashboard-content-wrapper">

                    {/* Recent / New Arrivals */}
                    {!searchQuery && activeGenre === 'All' && recentBooks.length > 0 && (
                        <div className="recent-section">
                            <div className="section-header">
                                <div className="section-header-icon">
                                    <TrendingUp size={22} color="var(--primary)" />
                                </div>
                                <div>
                                    <h2>Fresh Off the Press</h2>
                                    <p>The latest additions to our collection.</p>
                                </div>
                            </div>

                            <div className="recent-grid">
                                {recentBooks.map(book => (
                                    <div
                                        key={`recent-${book.uuid}`}
                                        className="recent-card"
                                        onClick={() => navigate(`/read/${book.uuid}`)}
                                    >
                                        <div className="recent-card-cover" style={getCoverStyle(book.title)}>
                                            <BookOpen size={44} color="rgba(0,0,0,0.25)" />
                                            {userReviews[book.bookId || book.uuid] && (
                                                <div className="reviewed-badge">
                                                    <CheckCircle size={11} /> Reviewed
                                                </div>
                                            )}
                                        </div>
                                        <div className="recent-card-body">
                                            <h3 className="recent-card-title">{book.title}</h3>
                                            <p className="recent-card-author">{book.author_name || 'Unknown Author'}</p>
                                            <Button onClick={e => { e.stopPropagation(); navigate(`/read/${book.uuid}`); }}>
                                                Read Now
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Feed Header */}
                    <div className="feed-header">
                        <h2>{searchQuery ? `Results for "${searchQuery}"` : (activeGenre === 'All' ? 'Browse Collection' : activeGenre)}</h2>
                        <span className="feed-count">{filteredBooks.length} Books</span>
                    </div>

                    {/* Book Grid */}
                    {isLoading ? (
                        <div className="loading-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : filteredBooks.length > 0 ? (
                        <div className="responsive-book-grid">
                            {filteredBooks.map(book => (
                                <div
                                    key={book.uuid}
                                    className="modern-book-card"
                                    onClick={() => navigate(`/read/${book.uuid}`)}
                                >
                                    <div className="card-image-container">
                                        <div className="card-placeholder-art" style={getCoverStyle(book.title)}>
                                            <div className="card-art-pattern" style={{ color: `hsl(${book.title.length * 15}, 55%, 30%)` }}>
                                                <BookOpen size={48} />
                                            </div>
                                        </div>

                                        <div className="card-overlay">
                                            <button
                                                className="overlay-btn"
                                                onClick={e => { e.stopPropagation(); navigate(`/read/${book.uuid}`); }}
                                            >
                                                Read Now
                                            </button>
                                        </div>

                                        <div className="card-badges">
                                            {userReviews[book.bookId || book.uuid] && (
                                                <span className="badge reviewed">
                                                    <CheckCircle size={11} /> Reviewed
                                                </span>
                                            )}
                                            {book.average_rating > 0 && (
                                                <span className="badge rating">
                                                    <Star size={11} fill="#eab308" color="#eab308" />
                                                    {Number(book.average_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-details">
                                        <h3 className="card-title">{book.title}</h3>
                                        <p className="card-author">{book.author_name || 'Unknown Author'}</p>
                                        <div className="card-footer-actions">
                                            <div className="left-actions">
                                                <button
                                                    className={`icon-btn ${userReviews[book.bookId] ? 'active-gold' : ''}`}
                                                    onClick={e => openReviewModal(e, book)}
                                                    title={userReviews[book.bookId] ? 'Edit your review' : 'Write a review'}
                                                >
                                                    <Star size={16} fill={userReviews[book.bookId] ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    className="icon-btn"
                                                    onClick={e => handleDownload(e, book.uuid, book.title)}
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                            <button
                                                className="icon-btn"
                                                onClick={e => e.stopPropagation()}
                                                title="Add to Wishlist"
                                            >
                                                <Heart size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Compass size={56} style={{ opacity: 0.2, marginBottom: '1.5rem', color: 'var(--text-tertiary)' }} />
                            <h3>No books found.</h3>
                            <p>Try adjusting your search or filters.</p>
                            {searchQuery && (
                                <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear Search</Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <Modal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                title={userReviews[selectedBook?.bookId]
                    ? `Edit Review — "${selectedBook?.title}"`
                    : `Review — "${selectedBook?.title || 'Book'}"`
                }
            >
                <form onSubmit={handleSubmitReview}>
                    {userReviews[selectedBook?.bookId] && (
                        <div className="review-existing-notice">
                            <Info size={15} />
                            You've already reviewed this book. You can update it below.
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="review-label">Rating</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', transform: reviewRating >= star ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }}
                                >
                                    <Star
                                        size={32}
                                        fill={reviewRating >= star ? '#eab308' : 'none'}
                                        color={reviewRating >= star ? '#eab308' : 'var(--text-tertiary)'}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="review-comment" className="review-label">Your Review</label>
                        <textarea
                            id="review-comment"
                            className="review-textarea"
                            rows="4"
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="What did you think about this book?"
                            required
                        />
                    </div>

                    <div className="modal-actions-row">
                        <Button type="button" variant="secondary" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmittingReview}>
                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </form>
            </Modal>

        </DashboardLayout>
    );
};

export default ReaderDashboard;
