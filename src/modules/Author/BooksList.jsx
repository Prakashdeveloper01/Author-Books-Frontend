import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, FileText, CheckCircle, Trash2, Edit2, AlertCircle, X, Eye } from 'lucide-react';
import api, { listBooks, deleteBook, API_URL } from '../../services/api';
import Button from '../../components/ui/Button';
import './BooksList.css';

const BooksList = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [deleteModal, setDeleteModal] = useState({ show: false, book: null });
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });

    useEffect(() => { fetchBooks(); }, []);

    const fetchBooks = async () => {
        setIsLoading(true);
        try {
            const res = await listBooks();
            if (res.status === '1') setBooks(res.data || []);
        } catch (err) {
            console.error('Failed to list books:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal.book) return;
        try {
            const res = await deleteBook(deleteModal.book.uuid);
            if (res.status === '1') {
                setBooks(books.filter(b => b.uuid !== deleteModal.book.uuid));
                setDeleteModal({ show: false, book: null });
            }
        } catch (err) {
            setDeleteModal({ show: false, book: null });
            setErrorModal({ show: true, message: 'Could not delete book. It may have active dependencies.' });
        }
    };

    const handleViewPdf = async (book) => {
        let files = book.bookFiles;
        if (!files) { setErrorModal({ show: true, message: 'No document files attached to this book.' }); return; }

        let pdfPath = null;
        if (Array.isArray(files) && files.length > 0) {
            pdfPath = files[0].path || files[0];
        } else if (typeof files === 'string') {
            try {
                const parsed = JSON.parse(files);
                pdfPath = Array.isArray(parsed) && parsed.length > 0 ? (parsed[0].path || parsed[0]) : files;
            } catch { pdfPath = files; }
        }

        if (!pdfPath) { setErrorModal({ show: true, message: 'Could not find a valid PDF path.' }); return; }

        const newWindow = window.open('', '_blank');
        if (newWindow) newWindow.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background:#f8fafc;color:#64748b;"><div>Loading document...</div></body></html>');

        try {
            let fetchUrl = pdfPath;
            if (typeof fetchUrl === 'string' && !fetchUrl.startsWith('http') && !fetchUrl.startsWith('blob:')) {
                const cleanPath = fetchUrl.startsWith('/') ? fetchUrl.slice(1) : fetchUrl;
                fetchUrl = `${API_URL}/${cleanPath}`;
            }
            const response = await api.get(fetchUrl, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(blob);
            if (newWindow) newWindow.location.href = fileURL;
            else window.open(fileURL, '_blank');
        } catch {
            let directUrl = pdfPath;
            if (typeof directUrl === 'string' && !directUrl.startsWith('http')) {
                const cleanPath = directUrl.startsWith('/') ? directUrl.slice(1) : directUrl;
                directUrl = `${API_URL}/${cleanPath}`;
            }
            if (newWindow) newWindow.location.href = directUrl;
            else setErrorModal({ show: true, message: 'Failed to load the document.' });
        }
    };

    const stats = {
        total: books.length,
        published: books.filter(b => b.status === 1).length,
        drafts: books.filter(b => b.status !== 1).length,
    };

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' ? true : activeTab === 'published' ? book.status === 1 : book.status !== 1;
        return matchesSearch && matchesTab;
    });

    const tabs = [
        { id: 'all', label: 'All Books' },
        { id: 'published', label: 'Published' },
        { id: 'draft', label: 'Drafts' },
    ];

    const statCards = [
        { label: 'Total Books', value: stats.total, icon: <BookOpen size={22} color="#4f46e5" /> },
        { label: 'Published', value: stats.published, icon: <CheckCircle size={22} color="#10b981" /> },
        { label: 'In Draft', value: stats.drafts, icon: <FileText size={22} color="#f59e0b" /> },
    ];

    return (
        <div className="author-books-page">

            {/* Header */}
            <div className="books-page-header">
                <div>
                    <h1 className="books-page-title">Publication Manager</h1>
                    <p className="books-page-subtitle">Manage your books, track status, and organize your portfolio.</p>
                </div>
                <button className="new-book-btn" onClick={() => navigate('/author/books/new')}>
                    <Plus size={18} /> New Book
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div>
                            <p className="stat-label">{s.label}</p>
                            <p className="stat-value">{s.value}</p>
                        </div>
                        <div className="stat-icon-wrap">{s.icon}</div>
                    </div>
                ))}
            </div>

            {/* Main Panel */}
            <div className="books-panel">
                {/* Toolbar */}
                <div className="books-toolbar">
                    <div style={{ display: 'flex', gap: '2rem', position: 'relative' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                                {activeTab === tab.id && <span className="tab-underline" />}
                            </button>
                        ))}
                    </div>

                    <div className="search-wrap">
                        <Search size={17} />
                        <input
                            type="text"
                            className="search-input-author"
                            placeholder="Search by title, ISBN..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-clear-btn" onClick={() => setSearchTerm('')}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Cards */}
                {isLoading ? (
                    <div className="books-loading">Loading your library...</div>
                ) : filteredBooks.length > 0 ? (
                    <div className="books-grid">
                        {filteredBooks.map((book, idx) => {
                            const isPub = book.status === 1;
                            return (
                                <div
                                    key={book.uuid}
                                    className="author-book-card"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    {/* Cover */}
                                    <div className="book-card-cover" onClick={() => handleViewPdf(book)} title="Click to read">
                                        <div className="book-thumb">
                                            <FileText size={22} color="#94a3b8" opacity={0.5} />
                                        </div>
                                        <div className={`status-badge ${isPub ? 'published' : 'draft'}`}>
                                            <div className={`status-dot ${isPub ? 'published' : 'draft'}`} />
                                            {isPub ? 'Published' : 'Draft'}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="book-card-body">
                                        <h3 className="book-card-title" title={book.title}>{book.title}</h3>
                                        <p className="book-card-isbn">ISBN: {book.isbn || 'N/A'}</p>

                                        <div className="book-card-actions">
                                            <button className="action-btn-primary" onClick={() => handleViewPdf(book)}>
                                                <Eye size={14} /> Read
                                            </button>
                                            <button className="action-btn-secondary" onClick={() => navigate(`/author/books/${book.uuid}`)}>
                                                <Edit2 size={13} /> Edit
                                            </button>
                                            <button
                                                className="action-btn-danger"
                                                onClick={e => { e.stopPropagation(); setDeleteModal({ show: true, book }); }}
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-books">
                        <div className="empty-icon-wrap"><BookOpen size={24} color="#94a3b8" /></div>
                        <h3>No books found</h3>
                        <p>Try adjusting your search or create your first book.</p>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-icon-wrap danger"><Trash2 size={22} color="#f43f5e" /></div>
                        <h3>Delete Book?</h3>
                        <p>Are you sure you want to delete <strong>"{deleteModal.book?.title}"</strong>? This cannot be undone.</p>
                        <div className="modal-actions">
                            <Button variant="secondary" onClick={() => setDeleteModal({ show: false, book: null })}>Cancel</Button>
                            <Button onClick={confirmDelete} style={{ background: '#f43f5e', borderColor: '#f43f5e' }}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {errorModal.show && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <div className="modal-icon-wrap danger"><AlertCircle size={22} color="#f43f5e" /></div>
                        <h3>Error</h3>
                        <p>{errorModal.message}</p>
                        <Button onClick={() => setErrorModal({ show: false, message: '' })}>Close</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BooksList;
