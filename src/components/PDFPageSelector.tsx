import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { convertPDFToImages, PDFPageImage } from '../utils/pdfToImage';

interface PDFPageSelectorProps {
    pdfFile: File;
    onPageSelect: (imageData: string) => void;
    onAllPagesSelect: (pages: PDFPageImage[]) => void;
    onBack: () => void;
}

export function PDFPageSelector({ pdfFile, onPageSelect, onAllPagesSelect, onBack }: PDFPageSelectorProps) {
    const [pages, setPages] = useState<PDFPageImage[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPDF = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const pdfPages = await convertPDFToImages(pdfFile, 1.5);
                setPages(pdfPages);
                if (pdfPages.length > 0) {
                    setCurrentPage(0);
                }
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadPDF();
    }, [pdfFile]);

    const handleSelectPage = () => {
        if (pages[currentPage]) {
            onPageSelect(pages[currentPage].imageData);
        }
    };

    const handleSelectAllPages = () => {
        if (pages.length > 0) {
            onAllPagesSelect(pages);
        }
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-gray-400 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading PDF pages...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 mb-4">
                    {error}
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>
        );
    }

    if (pages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <p className="text-gray-400 mb-4">No pages found in PDF</p>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>
        );
    }

    const currentPageData = pages[currentPage];

    return (
        <div className="flex-1 flex flex-col bg-gray-900">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="text-sm font-medium text-gray-400">
                    Select PDF Page ({pages.length} page{pages.length !== 1 ? 's' : ''})
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="relative max-w-4xl w-full">
                    {/* Page preview */}
                    <div className="bg-black/20 rounded-lg p-4 mb-6">
                        <img
                            src={currentPageData.imageData}
                            alt={`Page ${currentPageData.pageNumber}`}
                            className="max-w-full max-h-[60vh] mx-auto object-contain rounded shadow-lg"
                        />
                    </div>

                    {/* Navigation controls */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 0}
                            className={`p-2 rounded-lg transition-colors ${
                                currentPage === 0
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-white font-medium min-w-[120px] text-center">
                            Page {currentPage + 1} / {pages.length}
                        </span>

                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === pages.length - 1}
                            className={`p-2 rounded-lg transition-colors ${
                                currentPage === pages.length - 1
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Select buttons */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleSelectPage}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all"
                        >
                            Select This Page for OCR
                        </button>
                        <button
                            onClick={handleSelectAllPages}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg hover:shadow-green-600/20 transition-all"
                        >
                            OCR All Pages ({pages.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Page thumbnails */}
            <div className="border-t border-gray-700 bg-gray-800/50 p-4 overflow-x-auto">
                <div className="flex gap-2 justify-center">
                    {pages.map((page, index) => (
                        <button
                            key={page.pageNumber}
                            onClick={() => setCurrentPage(index)}
                            className={`relative flex-shrink-0 rounded overflow-hidden transition-all ${
                                index === currentPage
                                    ? 'ring-2 ring-blue-500 shadow-lg'
                                    : 'opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img
                                src={page.imageData}
                                alt={`Page ${page.pageNumber}`}
                                className="h-24 w-auto object-contain bg-gray-900"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 text-center">
                                {page.pageNumber}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
