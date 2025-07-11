// projects/ng-universal-file-previewer/src/lib/services/pdf-renderer.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PdfRendererService {
  private pdfjs: any = null;
  private isInitialized = false;

  constructor() {
    this.initializePdfJs();
  }

  private async initializePdfJs() {
    try {
      // Add Promise.withResolvers polyfill before loading PDF.js
      this.addPromisePolyfill();

      // Import PDF.js dynamically
      this.pdfjs = await import('pdfjs-dist');

      // Set worker source - MUST match the PDF.js version
      this.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

      this.isInitialized = true;
      console.log('PDF.js initialized successfully');
    } catch (error) {
      console.warn('PDF.js not available:', error);
      this.isInitialized = false;
    }
  }

  private addPromisePolyfill() {
    // Add Promise.withResolvers polyfill if not available
    if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
      (Promise as any).withResolvers = function () {
        let resolve: any, reject: any;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }
  }

  async renderPdfPage(
    file: File,
    pageNumber: number = 1,
    scale: number = 1.2
  ): Promise<string> {
    if (!this.isInitialized || !this.pdfjs) {
      throw new Error('PDF.js not initialized');
    }

    try {
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF document with error handling
      const loadingTask = this.pdfjs.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;

      // Ensure page number is valid
      const validPageNumber = Math.max(1, Math.min(pageNumber, pdf.numPages));

      // Get page
      const page = await pdf.getPage(validPageNumber);

      // Set up canvas with device pixel ratio for better quality
      const devicePixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * devicePixelRatio });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Scale context for high DPI displays
      canvas.style.width = Math.floor(viewport.width / devicePixelRatio) + 'px';
      canvas.style.height =
        Math.floor(viewport.height / devicePixelRatio) + 'px';

      context.scale(devicePixelRatio, devicePixelRatio);

      // Render page with timeout
      const renderTask = page.render({
        canvasContext: context,
        viewport: page.getViewport({ scale }),
      });

      await Promise.race([
        renderTask.promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PDF rendering timeout')), 10000)
        ),
      ]);

      // Get page info
      const pageInfo = {
        totalPages: pdf.numPages,
        currentPage: validPageNumber,
        width: viewport.width,
        height: viewport.height,
      };

      // Return HTML with rendered canvas
      return this.generatePdfHtml(canvas, file, pageInfo, scale);
    } catch (error) {
      console.error('PDF rendering error:', error);
      throw new Error(`Failed to render PDF: ${error}`);
    }
  }

  // Updated generatePdfHtml method for PdfRendererService
  // Clean PDF HTML generation without JavaScript functions
  private generatePdfHtml(
    canvas: HTMLCanvasElement,
    file: File,
    pageInfo: any,
    currentScale: number = 1.2
  ): string {
    const canvasDataUrl = canvas.toDataURL('image/png', 0.95);

    return `
    <div class="pdf-viewer" 
         data-file-name="${file.name}" 
         data-total-pages="${pageInfo.totalPages}" 
         data-current-page="${pageInfo.currentPage}"
         data-scale="${currentScale}">
      <div class="pdf-document-header">
        <div class="pdf-title">
          <span class="pdf-icon">📄</span>
          <span class="pdf-name">${file.name}</span>
        </div>
        <div class="pdf-metadata">
          <span class="pdf-size">${(file.size / 1024 / 1024).toFixed(
            2
          )} MB</span>
          <span class="pdf-page-count">${pageInfo.totalPages} pages</span>
        </div>
      </div>
      
      <div class="pdf-canvas-container">
        <img src="${canvasDataUrl}" 
             alt="PDF Page ${pageInfo.currentPage}" 
             class="pdf-page-image"
             style="max-width: 100%; height: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; display: block; margin: 0 auto;">
      </div>
      
      <div class="pdf-document-info">
        <div class="pdf-stats">
          <span><strong>Current Page:</strong> ${pageInfo.currentPage} of ${
      pageInfo.totalPages
    }</span>
          <span><strong>Scale:</strong> ${Math.round(
            currentScale * 100
          )}%</span>
          <span><strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(
            2
          )} MB</span>
        </div>
      </div>
    </div>
  `;
  }

  async getPdfInfo(
    file: File
  ): Promise<{ numPages: number; title?: string; author?: string }> {
    if (!this.isInitialized || !this.pdfjs) {
      throw new Error('PDF.js not initialized');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = this.pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let metadata;
      try {
        metadata = await pdf.getMetadata();
      } catch (e) {
        console.warn('Could not get PDF metadata:', e);
        metadata = { info: {} };
      }

      return {
        numPages: pdf.numPages,
        title: metadata.info?.Title,
        author: metadata.info?.Author,
      };
    } catch (error) {
      console.error('PDF info error:', error);
      throw new Error(`Failed to get PDF info: ${error}`);
    }
  }

  // Helper method to check if PDF.js is available
  isAvailable(): boolean {
    return this.isInitialized && !!this.pdfjs;
  }

  // Method to reinitialize if needed
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.pdfjs = null;
    await this.initializePdfJs();
  }

  // Get initialization status
  getStatus(): { isInitialized: boolean; error?: string } {
    return {
      isInitialized: this.isInitialized,
      error: this.isInitialized ? undefined : 'PDF.js not properly initialized',
    };
  }
}
