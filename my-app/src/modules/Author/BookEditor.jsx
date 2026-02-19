import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud, FileText, CheckCircle, AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import { createBook, getBook, updateBook, uploadBookFile } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';

const BookEditor = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const isEditMode = !!uuid;

    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorModal, setErrorModal] = useState({ show: false, message: '' });

    const [bookData, setBookData] = useState({
        title: '',
        description: '',
        isbn: '',
        language: 'EN',
        pageCount: 0,
        status: 1 // 0=Draft, 1=Published
    });
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const languages = [
        { code: 'EN', label: 'English' },
        { code: 'ES', label: 'Spanish' },
        { code: 'FR', label: 'French' },
        { code: 'DE', label: 'German' },
        { code: 'HI', label: 'Hindi' },
        { code: 'ZH', label: 'Chinese' },
        { code: 'JA', label: 'Japanese' }
    ];

    useEffect(() => {
        if (isEditMode) {
            fetchBookDetails();
        }
    }, [uuid]);

    const fetchBookDetails = async () => {
        setIsLoading(true);
        try {
            const res = await getBook(uuid);
            if (res.status === '1') {
                const book = res.data;
                // Merge details if nested
                const details = book.bookDetails || {};
                setBookData({
                    title: book.title,
                    description: details.description || '',
                    isbn: details.isbn || '',
                    language: details.language || 'EN',
                    pageCount: details.pageCount || 0,
                    status: book.status || 0
                });
            }
        } catch (error) {
            console.error("Failed to load book:", error);
            addToast('Failed to load book details. Redirecting...', 'error');
            navigate('/author/books');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        if (bookData.status === 1) {
            setShowConfirmation(true);
        } else {
            handleFinalSubmit();
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setShowConfirmation(false);

        try {
            let bookUuid = uuid;

            // 1. Create or Update Book Metadata
            if (isEditMode) {
                await updateBook(uuid, { ...bookData, bookUuid: uuid });
            } else {
                const res = await createBook(bookData);
                if (res.status === '1') {
                    bookUuid = res.data.uuid;
                } else {
                    throw new Error(res.message || "Failed to create book");
                }
            }

            // 2. Upload File if selected
            if (file) {
                // Determine type (simple logic)
                const type = file.name.endsWith('.pdf') ? 'PDF' : 'EPUB';
                await uploadBookFile(bookUuid, file, type);
            }

            setShowSuccess(true);
            // navigate('/author/books'); // Moved to modal action

        } catch (error) {
            console.error("Save failed:", error);
            setErrorModal({ show: true, message: error.message || "Something went wrong" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isEditMode && !bookData.title) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Editor...</div>;
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

            {/* Error Modal */}
            {errorModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px', width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', background: '#fee2e2', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                        }}>
                            <AlertCircle size={24} color="#dc2626" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>Error</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            {errorModal.message}
                        </p>
                        <Button onClick={() => setErrorModal({ show: false, message: '' })} style={{ width: '100%', background: '#dc2626' }}>Close</Button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px', width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                        }}>
                            <CheckCircle size={24} color="#16a34a" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>Success!</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Your book <strong>"{bookData.title}"</strong> has been {isEditMode ? 'updated' : 'created'} successfully.
                        </p>
                        <Button onClick={() => navigate('/author/books')} style={{ width: '100%' }}>Go to Library</Button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '16px', width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', background: '#dbeafe', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                        }}>
                            <UploadCloud size={24} color="#2563eb" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>Confirm Publication</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                            Are you sure you want to publish <strong>"{bookData.title}"</strong>? It will be visible to all readers immediately.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="outline" onClick={() => setShowConfirmation(false)} style={{ flex: 1, border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}>Cancel</Button>
                            <Button onClick={handleFinalSubmit} style={{ flex: 1 }}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/author/books')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', hover: { background: '#f1f5f9' } }}
                >
                    <ArrowLeft size={24} color="#64748b" />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' }}>
                        {isEditMode ? 'Edit Book' : 'Create New Book'}
                    </h1>
                    <p style={{ color: '#64748b' }}>
                        {isEditMode ? `Updating "${bookData.title}"` : 'Enter book details and upload content.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        background: '#f1f5f9',
                        padding: '4px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #e2e8f0'
                    }}>
                        <button
                            type="button"
                            onClick={() => setBookData({ ...bookData, status: 0 })}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: bookData.status === 0 ? '#fff' : 'transparent',
                                color: bookData.status === 0 ? '#d97706' : '#64748b',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                boxShadow: bookData.status === 0 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => setBookData({ ...bookData, status: 1 })}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: bookData.status === 1 ? '#fff' : 'transparent',
                                color: bookData.status === 1 ? '#15803d' : '#64748b',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                boxShadow: bookData.status === 1 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <CheckCircle size={14} /> Published
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleInitialSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left Column: Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            Basic Information
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Book Title</label>
                            <Input
                                name="title"
                                value={bookData.title}
                                onChange={handleChange}
                                placeholder="e.g. The Great Gatsby"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Description / Synopsis</label>
                            <textarea
                                name="description"
                                value={bookData.description}
                                onChange={handleChange}
                                rows="8"
                                placeholder="Write a distinct summary of your book..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="card" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UploadCloud size={20} /> Book Content
                        </h3>

                        <div style={{
                            border: '2px dashed #cbd5e1',
                            borderRadius: '12px',
                            padding: '3rem',
                            textAlign: 'center',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            position: 'relative'
                        }}>
                            <input
                                type="file"
                                accept=".pdf,.epub"
                                onChange={handleFileChange}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />

                            {file ? (
                                <div style={{ color: '#15803d' }}>
                                    <FileText size={48} style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontWeight: '700' }}>{file.name}</p>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setFile(null); }}
                                        style={{ marginTop: '1rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <div style={{ color: '#64748b' }}>
                                    <UploadCloud size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Click or Drag file to upload</p>
                                    <p style={{ fontSize: '0.85rem' }}>PDF or EPUB (Max 50MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* Right Column: Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                            Metadata
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>ISBN</label>
                                <Input name="isbn" value={bookData.isbn} onChange={handleChange} placeholder="Optional" />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Language</label>
                                <div
                                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        background: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: isLanguageOpen ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
                                        borderColor: isLanguageOpen ? '#3b82f6' : '#e2e8f0'
                                    }}
                                >
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>
                                        {languages.find(l => l.code === bookData.language)?.label || bookData.language}
                                    </span>
                                    <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isLanguageOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }} />
                                </div>

                                {isLanguageOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        width: '100%',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        marginTop: '4px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        zIndex: 50,
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        animation: 'slideDown 0.2s ease-out',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {languages.map(lang => (
                                            <div
                                                key={lang.code}
                                                onClick={() => {
                                                    handleChange({ target: { name: 'language', value: lang.code } });
                                                    setIsLanguageOpen(false);
                                                }}
                                                style={{
                                                    padding: '0.75rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f8fafc',
                                                    color: bookData.language === lang.code ? '#3b82f6' : '#475569',
                                                    fontWeight: bookData.language === lang.code ? '600' : '400',
                                                    background: bookData.language === lang.code ? '#eff6ff' : 'white',
                                                    transition: 'background 0.1s'
                                                }}
                                                onMouseEnter={(e) => { if (bookData.language !== lang.code) e.currentTarget.style.background = '#f8fafc'; }}
                                                onMouseLeave={(e) => { if (bookData.language !== lang.code) e.currentTarget.style.background = 'white'; }}
                                            >
                                                {lang.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <style>{`
                                @keyframes slideDown {
                                    from { opacity: 0; transform: translateY(-10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Page Count</label>
                                <Input type="number" name="pageCount" value={bookData.pageCount} onChange={handleChange} placeholder="0" />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !bookData.title}
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        {isLoading ? 'Saving...' : 'Submit'}
                    </Button>

                </div>

            </form>
        </div>
    );
};

export default BookEditor;
