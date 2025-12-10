import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker to use local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFPageImage {
    pageNumber: number;
    imageData: string;
    width: number;
    height: number;
}

/**
 * Convert a PDF file to an array of base64-encoded images
 * @param file The PDF file to convert
 * @param scale Scale factor for rendering (default: 2.0 for high quality)
 * @returns Promise resolving to array of page images
 */
export async function convertPDFToImages(
    file: File,
    scale: number = 2.0
): Promise<PDFPageImage[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const pages: PDFPageImage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Failed to get canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        // Convert canvas to base64 image
        const imageData = canvas.toDataURL('image/png');

        pages.push({
            pageNumber: pageNum,
            imageData,
            width: viewport.width,
            height: viewport.height,
        });
    }

    return pages;
}

/**
 * Convert a single page of a PDF to a base64-encoded image
 * @param file The PDF file
 * @param pageNumber The page number to convert (1-indexed)
 * @param scale Scale factor for rendering (default: 2.0)
 * @returns Promise resolving to the page image data
 */
export async function convertPDFPageToImage(
    file: File,
    pageNumber: number,
    scale: number = 2.0
): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
        throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`);
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Failed to get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport: viewport,
    }).promise;

    return canvas.toDataURL('image/png');
}

/**
 * Get the number of pages in a PDF file
 * @param file The PDF file
 * @returns Promise resolving to the number of pages
 */
export async function getPDFPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
}
