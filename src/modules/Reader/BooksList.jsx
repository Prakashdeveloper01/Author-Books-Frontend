import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Heart, Download, Star, CheckCircle, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { listBooks, downloadBookFile, createReview, listReviews, updateReview, getProfile } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Info } from 'lucide-react';
import '../Reader/Dashboard.css';

const ReaderBooksList = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [userReviews, setUserReviews] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [activeGenre, setActiveGenre] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const genres = ['All', ...new Set(books.map(b => b.genre).filter(Boolean))];

    // Review Modal State
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
                if (reviewsRes && reviewsRes.data) {
                    reviewsRes.data.forEach(review => {
                        reviewsMap[review.bookId] = review;
                    });
                }
                setUserReviews(reviewsMap);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = books;
        if (activeGenre !== 'All') {
            result = result.filter(book => book.genre === activeGenre);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(book =>
                book.title.toLowerCase().includes(query) ||
                (book.author_name && book.author_name.toLowerCase().includes(query))
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
        } catch (error) {
            addToast('Failed to download book.', 'error');
        }
    };

    const openReviewModal = (e, book) => {
        e.stopPropagation();
        setSelectedBook(book);
        const existingReview = userReviews[book.bookId];
        if (existingReview) {
            setReviewRating(existingReview.rating);
            setReviewComment(existingReview.comment);
        } else {
            setReviewRating(5);
            setReviewComment('');
        }
        setIsReviewOpen(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setIsSubmittingReview(true);
        try {
            const existingReview = userReviews[selectedBook.bookId];
            if (existingReview) {
                await updateReview(existingReview.id, { rating: reviewRating, comment: reviewComment });
                setUserReviews(prev => ({
                    ...prev,
                    [selectedBook.bookId]: { ...existingReview, rating: reviewRating, comment: reviewComment }
                }));
                addToast('Review updated successfully!', 'success');
            } else {
                const newReview = await createReview({ bookId: selectedBook.bookId, rating: reviewRating, comment: reviewComment });
                setUserReviews(prev => ({
                    ...prev,
                    [selectedBook.bookId]: { id: newReview.id || Date.now(), bookId: selectedBook.bookId, rating: reviewRating, comment: reviewComment }
                }));
                addToast('Review submitted successfully!', 'success');
            }
            setIsReviewOpen(false);
        } catch (error) {
            addToast(error.response?.data?.detail || 'Failed to process review.', 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <DashboardLayout role="reader">
            <div className="reader-dashboard">

                {/* --- HEADER (Search + Filter) --- */}
                <div className="dashboard-header">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search books or authors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                    {/* Section Title */}
                    <div className="feed-header">
                        <h2>
                            {searchQuery
                                ? `Results for "${searchQuery}"`
                                : activeGenre === 'All'
                                    ? 'All Books'
                                    : activeGenre}
                        </h2>
                        <span className="feed-count">{filteredBooks.length} Books</span>
                    </div>

                    {isLoading ? (
                        <div className="loading-grid">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="skeleton-card"></div>
                            ))}
                        </div>
                    ) : filteredBooks.length > 0 ? (
                        <div className="responsive-book-grid">
                            {filteredBooks.map((book) => (
                                <div key={book.uuid} className="modern-book-card" onClick={() => navigate(`/books/${book.uuid}`)}>
                                    <div className="card-image-container">
                                        <div className="card-placeholder-art" style={{ background: `hsl(${book.title.length * 15}, 65%, 85%)` }}>
                                            <div className="card-art-pattern" style={{ color: `hsl(${book.title.length * 15}, 65%, 40%)` }}>
                                                <BookOpen size={48} />
                                            </div>
                                        </div>

                                        <div className="card-overlay">
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/read/${book.uuid}`); }}
                                                className="overlay-btn primary"
                                            >Read</Button>
                                        </div>

                                        <div className="card-badges">
                                            {userReviews[book.bookId] && (
                                                <span className="badge reviewed">
                                                    <CheckCircle size={12} style={{ marginRight: 4 }} /> Reviewed
                                                </span>
                                            )}
                                            <span className="badge rating">
                                                <Star size={12} fill="#eab308" color="#eab308" /> 4.8
                                            </span>
                                        </div>
                                    </div>

                                    <div className="card-details">
                                        <h3 className="card-title">{book.title}</h3>
                                        <p className="card-author">{book.author_name || 'Unknown Author'}</p>

                                        <div className="card-footer-actions">
                                            <div className="left-actions">
                                                <button
                                                    className={`icon-btn ${userReviews[book.bookId] ? 'active-gold' : ''}`}
                                                    onClick={(e) => openReviewModal(e, book)}
                                                    title={userReviews[book.bookId] ? 'Edit your review' : 'Write a review'}
                                                >
                                                    <Star size={18} fill={userReviews[book.bookId] ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    className="icon-btn"
                                                    onClick={(e) => handleDownload(e, book.uuid, book.title)}
                                                    title="Download"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                            <button className="icon-btn" onClick={(e) => e.stopPropagation()} title="Add to Wishlist">
                                                <Heart size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Compass size={64} style={{ opacity: 0.2, marginBottom: '1.5rem', color: '#64748b' }} />
                            <h3>No books found.</h3>
                            <p>Try adjusting your search or filters.</p>
                            {searchQuery && <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear Search</Button>}
                        </div>
                    )}
                </div>
            </div>

            {/* REVIEW MODAL */}
            <Modal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                title={userReviews[selectedBook?.bookId] ? `Edit Review for "${selectedBook?.title}"` : `Review "${selectedBook?.title || 'Book'}"`}
            >
                <form onSubmit={handleSubmitReview}>
                    {userReviews[selectedBook?.bookId] && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '0.9rem' }}>
                            <Info size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            You have already reviewed this book. You can update your rating and comment below.
                        </div>
                    )}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Rating</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setReviewRating(star)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', transform: reviewRating >= star ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.1s' }}>
                                    <Star size={32} fill={reviewRating >= star ? '#eab308' : 'none'} color={reviewRating >= star ? '#eab308' : '#cbd5e1'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="review-comment-bl" style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Your Review</label>
                        <textarea
                            id="review-comment-bl"
                            rows="4"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="What did you think about this book?"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '1rem', resize: 'vertical' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
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

export default ReaderBooksList;
