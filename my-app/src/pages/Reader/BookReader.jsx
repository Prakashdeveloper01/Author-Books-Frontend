import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { getBook, downloadBookFile } from '../../services/api';
import Button from '../../components/ui/Button';

const BookReader = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [book, setBook] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadBookAndFile = async () => {
            setIsLoading(true);
            try {
                // 1. Get Book Details to find the file ID
                const bookRes = await getBook(uuid);
                if (bookRes.status !== '1' || !bookRes.data) {
                    throw new Error("Could not load book details.");
                }
                setBook(bookRes.data);

                const files = bookRes.data.bookFiles;
                if (!files || files.length === 0) {
                    throw new Error("No file available for this book.");
                }

                // Assume first file is the main content (PDF/EPUB)
                const fileId = files[0].fileId;

                // 2. Download the file content as a Blob
                const fileRes = await downloadBookFile(uuid, fileId);

                // createObjectURL works with the Blob response from axios (responseType: 'blob')
                const blob = new Blob([fileRes.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                setPdfUrl(url);

            } catch (err) {
                console.error("Reader Error:", err);
                setError(err.message || "Failed to load book content.");
            } finally {
                setIsLoading(false);
            }
        };

        loadBookAndFile();

        // Cleanup blob URL on unmount
        return () => {
            if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
        };
    }, [uuid]);

    const handleDownload = () => {
        if (!pdfUrl || !book) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${book.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Loader2 className="animate-spin" size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: '#64748b' }}>Opening Book...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Unable to Read Book</h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#e2e8f0' }}>
            {/* Toolbar */}
            <div style={{
                height: '60px',
                background: 'white',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.title}
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" onClick={handleDownload} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Download
                    </Button>
                </div>
            </div>

            {/* PDF Viewer Area */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', background: '#525659' }}>
                <iframe
                    src={pdfUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF Reader"
                />
            </div>
        </div>
    );
};

export default BookReader;
