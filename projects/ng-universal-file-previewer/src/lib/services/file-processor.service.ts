// projects/ng-universal-file-previewer/src/lib/services/file-processor.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import {
  FileType,
  FilePreviewResult,
  FileMetadata,
} from '../models/file-types';
import { PdfRendererService } from './pdf-renderer.service';

@Injectable({
  providedIn: 'root',
})
export class FileProcessorService {
  private customProcessors = new Map<
    FileType,
    (file: File) => Promise<string>
  >();

  constructor(private pdfRenderer: PdfRendererService) {}

  registerCustomProcessor(
    type: FileType,
    processor: (file: File) => Promise<string>
  ): void {
    this.customProcessors.set(type, processor);
  }

  processFile(file: File, type: FileType): Observable<FilePreviewResult> {
    return from(this.processFileAsync(file, type)).pipe(
      catchError((error) =>
        throwError(() => new Error(`Failed to process file: ${error.message}`))
      )
    );
  }

  // Add method for PDF page rendering
  renderPdfPage(
    file: File,
    pageNumber: number,
    scale: number = 1.2
  ): Observable<string> {
    return from(this.renderPdfPageAsync(file, pageNumber, scale)).pipe(
      catchError((error) =>
        throwError(
          () => new Error(`Failed to render PDF page: ${error.message}`)
        )
      )
    );
  }

  private async renderPdfPageAsync(
    file: File,
    pageNumber: number,
    scale: number
  ): Promise<string> {
    if (this.pdfRenderer.isAvailable()) {
      return await this.pdfRenderer.renderPdfPage(file, pageNumber, scale);
    } else {
      throw new Error('PDF.js not available');
    }
  }

  private async processFileAsync(
    file: File,
    type: FileType
  ): Promise<FilePreviewResult> {
    // Check for custom processor first
    if (this.customProcessors.has(type)) {
      const processor = this.customProcessors.get(type)!;
      const content = await processor(file);
      return { content, type, metadata: this.extractMetadata(file) };
    }

    // Default processors
    let content: string;
    let metadata: FileMetadata = this.extractMetadata(file);

    switch (type) {
      case 'pdf':
        content = await this.processPDF(file);
        break;
      case 'csv':
        content = await this.processCSV(file);
        break;
      case 'xlsx':
      case 'xls':
        const excelResult = await this.processExcel(file);
        content = excelResult.content;
        metadata = { ...metadata, ...excelResult.metadata };
        break;
      case 'docx':
        content = await this.processDocx(file);
        break;
      case 'doc':
        content = await this.processDoc(file);
        break;
      case 'txt':
      case 'json':
      case 'html':
      case 'xml':
        content = await this.processText(file, type);
        break;
      case 'image':
        const imageResult = await this.processImage(file);
        content = imageResult.content;
        metadata = { ...metadata, ...imageResult.metadata };
        break;
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }

    return {
      content,
      type,
      metadata,
    };
  }

  private async processPDF(file: File): Promise<string> {
    try {
      // Check if PDF renderer is available
      if (this.pdfRenderer.isAvailable()) {
        return await this.pdfRenderer.renderPdfPage(file, 1, 1.2);
      } else {
        throw new Error('PDF.js not available');
      }
    } catch (error) {
      console.warn(
        'PDF.js rendering failed, showing enhanced placeholder:',
        error
      );

      // Enhanced fallback with better error information
      return `
        <div class="pdf-preview">
          <div class="preview-header">
            <h3>📄 PDF Document</h3>
            <div class="file-meta">
              <span>${file.name}</span>
              <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <div class="pdf-placeholder">
            <div class="pdf-icon">📑</div>
            <h4>PDF Preview Available</h4>
            <p><strong>File:</strong> ${file.name}</p>
            <p><strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(
              2
            )} MB</p>
            
            <div class="pdf-error">
              <h5>⚠️ PDF Rendering Issue</h5>
              <p><strong>Error:</strong> ${error}</p>
              <p>This could be due to:</p>
              <ul>
                <li>PDF.js library not properly loaded</li>
                <li>Browser compatibility issues</li>
                <li>Complex PDF structure</li>
                <li>Network connectivity problems</li>
              </ul>
            </div>
            
            <div class="integration-note">
              <h5>🚀 Enhanced PDF Features Available</h5>
              <p>For full PDF rendering capabilities:</p>
              <ul>
                <li>✓ Full document rendering</li>
                <li>✓ Page navigation</li>
                <li>✓ Zoom controls</li>
                <li>✓ Text selection</li>
                <li>✓ Search within document</li>
              </ul>
              
              <div class="setup-instructions">
                <h6>Setup Instructions:</h6>
                <code>npm install pdfjs-dist@3.4.120</code>
                <p>Then refresh the page to enable PDF rendering.</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  private async processCSV(file: File): Promise<string> {
    const text = await file.text();
    const lines = text
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 100);

    const rows = lines.map((line) => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim().replace(/^"|"$/g, ''));
      return cells;
    });

    const totalRows = text.split('\n').filter((line) => line.trim()).length;

    return `
      <div class="csv-preview">
        <div class="preview-header">
          <h3>📊 CSV Data</h3>
          <div class="file-meta">
            <span>Showing ${Math.min(
              100,
              totalRows
            )} of ${totalRows} rows</span>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>${
                rows[0]
                  ?.map((cell) => `<th>${this.escapeHtml(cell)}</th>`)
                  .join('') || ''
              }</tr>
            </thead>
            <tbody>
              ${rows
                .slice(1)
                .map(
                  (row) =>
                    `<tr>${row
                      .map((cell) => `<td>${this.escapeHtml(cell)}</td>`)
                      .join('')}</tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private async processExcel(
    file: File
  ): Promise<{ content: string; metadata: Partial<FileMetadata> }> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as any[][];

    const previewData = jsonData.slice(0, 50);

    const content = `
      <div class="excel-preview">
        <div class="preview-header">
          <h3>📗 Excel Workbook</h3>
          <div class="file-meta">
            <span>Sheet: ${sheetName}</span>
            <span>${workbook.SheetNames.length} sheets total</span>
            <span>Showing 50 of ${jsonData.length} rows</span>
          </div>
        </div>
        ${
          workbook.SheetNames.length > 1
            ? `
          <div class="sheet-tabs">
            ${workbook.SheetNames.map(
              (name) =>
                `<button class="sheet-tab ${
                  name === sheetName ? 'active' : ''
                }">${name}</button>`
            ).join('')}
          </div>
        `
            : ''
        }
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>${((previewData[0] as any[]) || [])
                .map((cell) => `<th>${this.escapeHtml(cell || '')}</th>`)
                .join('')}</tr>
            </thead>
            <tbody>
              ${previewData
                .slice(1)
                .map(
                  (row) =>
                    `<tr>${((row as any[]) || [])
                      .map((cell) => `<td>${this.escapeHtml(cell || '')}</td>`)
                      .join('')}</tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return {
      content,
      metadata: { sheetNames: workbook.SheetNames },
    };
  }

  private async processDocx(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      return `
        <div class="docx-preview">
          <div class="preview-header">
            <h3>📝 Word Document</h3>
            <div class="file-meta">
              <span>${file.name}</span>
            </div>
          </div>
          <div class="document-content">
            ${result.value}
          </div>
          ${
            result.messages.length > 0
              ? `
            <div class="conversion-notes">
              <h4>Conversion Notes:</h4>
              <ul>
                ${result.messages
                  .map((msg) => `<li>${msg.message}</li>`)
                  .join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
      `;
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error}`);
    }
  }

  private async processDoc(file: File): Promise<string> {
    return `
      <div class="doc-preview">
        <div class="preview-header">
          <h3>📄 Word Document (Legacy)</h3>
          <div class="file-meta">
            <span>${file.name}</span>
            <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
        <div class="legacy-notice">
          <div class="notice-icon">⚠️</div>
          <h4>Legacy Format Detected</h4>
          <p>DOC files require server-side conversion for preview.</p>
          <div class="suggestions">
            <h5>Recommended Solutions:</h5>
            <ul>
              <li>Convert to DOCX format for instant preview</li>
              <li>Use server-side conversion service</li>
              <li>Integrate with cloud APIs (Google Docs, Office 365)</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private async processText(file: File, type: FileType): Promise<string> {
    const text = await file.text();
    const truncatedText =
      text.length > 50000
        ? text.substring(0, 50000) + '\n\n[Content truncated...]'
        : text;

    const lineCount = text.split('\n').length;
    const language = this.getLanguageFromExtension(
      file.name.split('.').pop()?.toLowerCase() || ''
    );

    return `
      <div class="text-preview">
        <div class="preview-header">
          <h3>📄 ${this.getFileIcon(type)} ${language.toUpperCase()} File</h3>
          <div class="file-meta">
            <span>${lineCount} lines</span>
            <span>${(file.size / 1024).toFixed(1)} KB</span>
          </div>
        </div>
        <div class="code-container">
          <pre class="code-preview ${language}"><code>${this.escapeHtml(
      truncatedText
    )}</code></pre>
        </div>
      </div>
    `;
  }

  // Replace your processImage method with this super aggressive version

  private async processImage(
    file: File
  ): Promise<{ content: string; metadata: Partial<FileMetadata> }> {
    const url = URL.createObjectURL(file);
    const dimensions = await this.getImageDimensions(file);

    // MUCH smaller size limits for preview
    const maxDisplayWidth = 800; // Increased from 200
    const maxDisplayHeight = 600; // Increased from 150

    let displayWidth = dimensions.width;
    let displayHeight = dimensions.height;

    // Always scale down if image is larger than our max preview size
    if (displayWidth > maxDisplayWidth || displayHeight > maxDisplayHeight) {
      const aspectRatio = displayWidth / displayHeight;

      if (displayWidth > displayHeight) {
        // Landscape orientation
        displayWidth = maxDisplayWidth;
        displayHeight = maxDisplayWidth / aspectRatio;
      } else {
        // Portrait orientation
        displayHeight = maxDisplayHeight;
        displayWidth = maxDisplayHeight * aspectRatio;
      }

      // Double-check we don't exceed either dimension
      if (displayHeight > maxDisplayHeight) {
        displayHeight = maxDisplayHeight;
        displayWidth = maxDisplayHeight * aspectRatio;
      }
      if (displayWidth > maxDisplayWidth) {
        displayWidth = maxDisplayWidth;
        displayHeight = maxDisplayWidth / aspectRatio;
      }
    }

    // Generate unique ID for this image instance
    const imageId = 'img_' + Math.random().toString(36).substr(2, 9);

    const content = `
    <div class="image-preview">
      <div class="preview-header">
        <h3>🖼️ Image File</h3>
        <div class="file-meta">
          <span>${dimensions.width} × ${dimensions.height}px</span>
          <span>${(file.size / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      <div class="image-container" id="container-${imageId}">
        <div class="image-controls">
          <button class="zoom-btn" onclick="toggleImageZoom('${imageId}')">
            🔍 View Full Size
          </button>
          <button class="zoom-btn" onclick="window.open('${url}', '_blank')">
            🖼️ Open in New Tab
          </button>
          <button class="zoom-btn" onclick="downloadImage('${url}', '${
      file.name
    }')">
            📥 Download
          </button>
        </div>
        <div class="image-wrapper">
  <img id="${imageId}"
       src="${url}" 
       alt="Preview of ${file.name}" 
       onclick="toggleImageZoom('${imageId}')"
       width="${Math.round(displayWidth)}"
       height="${Math.round(displayHeight)}"
       style="
         width: ${Math.round(displayWidth)}px !important;
         height: ${Math.round(displayHeight)}px !important;
         object-fit: contain !important;
         cursor: pointer !important;
         display: block !important;
         margin: 0 auto !important;
       " />
</div>
      </div>
      <div class="image-details">
        <table class="details-table">
          <tr><td><strong>Filename:</strong></td><td>${file.name}</td></tr>
          <tr><td><strong>Type:</strong></td><td>${file.type}</td></tr>
          <tr><td><strong>Size:</strong></td><td>${(file.size / 1024).toFixed(
            1
          )} KB</td></tr>
          <tr><td><strong>Original Dimensions:</strong></td><td>${
            dimensions.width
          } × ${dimensions.height} pixels</td></tr>
          <tr><td><strong>Display Dimensions:</strong></td><td>${Math.round(
            displayWidth
          )} × ${Math.round(displayHeight)} pixels</td></tr>
          <tr><td><strong>Scale Factor:</strong></td><td>${(
            Math.min(
              displayWidth / dimensions.width,
              displayHeight / dimensions.height
            ) * 100
          ).toFixed(1)}%</td></tr>
          <tr><td><strong>Last Modified:</strong></td><td>${new Date(
            file.lastModified
          ).toLocaleString()}</td></tr>
        </table>
      </div>
    </div>
    
    <script>
      // Global functions for image zoom and download
      window.toggleImageZoom = function(imageId) {
        const img = document.getElementById(imageId);
        const container = document.getElementById('container-' + imageId);
        if (img && container) {
          if (img.classList.contains('zoomed')) {
            // Zoom out - return to preview size
            img.classList.remove('zoomed');
            container.classList.remove('has-zoomed-image');
            img.style.position = 'static';
            img.style.top = 'auto';
            img.style.left = 'auto';
            img.style.transform = 'none';
            img.style.zIndex = 'auto';
            img.style.width = '${Math.round(displayWidth)}px';
            img.style.height = '${Math.round(displayHeight)}px';
            img.style.maxWidth = '${Math.round(displayWidth)}px';
            img.style.maxHeight = '${Math.round(displayHeight)}px';
            img.style.minWidth = '${Math.round(displayWidth)}px';
            img.style.minHeight = '${Math.round(displayHeight)}px';
            img.style.cursor = 'pointer';
            img.style.padding = '0';
            img.style.background = 'transparent';
          } else {
            // Zoom in - show full size
            img.classList.add('zoomed');
            container.classList.add('has-zoomed-image');
            img.style.position = 'fixed';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '1000';
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.maxWidth = '95vw';
            img.style.maxHeight = '95vh';
            img.style.minWidth = 'auto';
            img.style.minHeight = 'auto';
            img.style.cursor = 'zoom-out';
            img.style.padding = '8px';
            img.style.background = 'white';
          }
        }
      };
      
      window.downloadImage = function(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      // Close zoom when clicking outside image
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('has-zoomed-image')) {
          const img = e.target.querySelector('.preview-image');
          if (img) {
            img.click(); // Trigger toggle to zoom out
          }
        }
      });
    </script>
  `;

    return {
      content,
      metadata: {
        dimensions,
        displayDimensions: {
          width: Math.round(displayWidth),
          height: Math.round(displayHeight),
        },
      },
    };
  }

  private extractMetadata(file: File): FileMetadata {
    return {
      filename: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
    };
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getLanguageFromExtension(extension: string): string {
    const languages: { [key: string]: string } = {
      js: 'javascript',
      ts: 'typescript',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      txt: 'text',
    };
    return languages[extension] || 'text';
  }

  private getFileIcon(type: FileType): string {
    const icons: { [key: string]: string } = {
      txt: '📄',
      json: '📋',
      html: '🌐',
      xml: '📋',
    };
    return icons[type] || '📄';
  }

  private getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  }
}
