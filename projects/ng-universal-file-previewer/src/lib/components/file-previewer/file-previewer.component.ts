// projects/ng-universal-file-previewer/src/lib/components/file-previewer/file-previewer.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FileProcessorService } from '../../services/file-processor.service';
import { FileValidatorService } from '../../services/file-validator.service';
import {
  FilePreviewConfig,
  FileType,
  FilePreviewResult,
  DEFAULT_CONFIG,
  SUPPORTED_MIME_TYPES,
} from '../../models/file-types';

@Component({
  selector: 'ngx-file-previewer',
  templateUrl: './file-previewer.component.html',
  styleUrls: ['./file-previewer.component.scss'],
})
export class FilePreviewerComponent implements OnInit, OnDestroy {
  // Input properties
  @Input() config: Partial<FilePreviewConfig> = {};
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() customClass = '';

  // Output properties
  @Output() fileSelected = new EventEmitter<File>();
  @Output() previewReady = new EventEmitter<FilePreviewResult>();
  @Output() error = new EventEmitter<string>();
  @Output() loadingChanged = new EventEmitter<boolean>();

  // Component state
  selectedFile: File | null = null;
  previewContent = '';
  previewType: FileType = 'unknown';
  loading = false;
  errorMessage = '';
  dragActive = false;

  // PDF-specific state
  currentPdfPage = 1;
  currentPdfScale = 1.2;
  totalPdfPages = 0;

  private destroy$ = new Subject<void>();
  mergedConfig: Required<FilePreviewConfig> = DEFAULT_CONFIG;

  constructor(
    private fileProcessor: FileProcessorService,
    private fileValidator: FileValidatorService,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.mergedConfig = { ...DEFAULT_CONFIG, ...this.config };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // PDF Navigation Methods
  navigatePdfPage(direction: number): void {
    if (!this.selectedFile || this.previewType !== 'pdf') return;

    const newPage = this.currentPdfPage + direction;
    if (newPage >= 1 && newPage <= this.totalPdfPages) {
      this.currentPdfPage = newPage;
      this.renderPdfPage(this.selectedFile, newPage, this.currentPdfScale);
    }
  }

  changePdfScale(scaleChange: number): void {
    if (!this.selectedFile || this.previewType !== 'pdf') return;

    const newScale = this.currentPdfScale + scaleChange;
    const clampedScale = Math.max(0.5, Math.min(3.0, newScale));

    if (clampedScale !== this.currentPdfScale) {
      this.currentPdfScale = clampedScale;
      this.renderPdfPage(this.selectedFile, this.currentPdfPage, clampedScale);
    }
  }

  downloadCurrentPage(): void {
    // Extract the image data URL from the current preview content
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.previewContent, 'text/html');
    const img = doc.querySelector('.pdf-page-image') as HTMLImageElement;

    if (img && img.src) {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = `${this.selectedFile?.name}_page_${this.currentPdfPage}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private renderPdfPage(
    file: File,
    pageNumber: number,
    scale: number = 1.2
  ): void {
    this.setLoading(true);

    this.fileProcessor
      .renderPdfPage(file, pageNumber, scale)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (content: string) => {
          this.previewContent = content;
          this.extractPdfInfo(content);
          this.setLoading(false);
        },
        error: (error) => {
          this.setError(`Error rendering PDF page: ${error.message}`);
          this.setLoading(false);
        },
      });
  }

  private extractPdfInfo(content: string): void {
    // Extract total pages from the rendered content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const pdfViewer = doc.querySelector('.pdf-viewer');

    if (pdfViewer) {
      const totalPages = pdfViewer.getAttribute('data-total-pages');
      const currentPage = pdfViewer.getAttribute('data-current-page');

      if (totalPages) this.totalPdfPages = parseInt(totalPages, 10);
      if (currentPage) this.currentPdfPage = parseInt(currentPage, 10);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  clearPreview(): void {
    this.selectedFile = null;
    this.previewContent = '';
    this.previewType = 'unknown';
    this.errorMessage = '';
    this.currentPdfPage = 1;
    this.currentPdfScale = 1.2;
    this.totalPdfPages = 0;
  }

  generatePreview(file?: File, fileType?: FileType): void {
    const targetFile = file || this.selectedFile;
    const targetType = fileType || this.previewType;

    if (!targetFile || !targetType) {
      this.setError('No file selected for preview');
      return;
    }

    this.setLoading(true);

    // For PDF files, use the current page and scale
    if (targetType === 'pdf') {
      this.renderPdfPage(targetFile, this.currentPdfPage, this.currentPdfScale);
      return;
    }

    // For other file types, use the regular processor
    this.fileProcessor
      .processFile(targetFile, targetType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: FilePreviewResult) => {
          this.previewContent = result.content;
          this.previewType = result.type;
          this.previewReady.emit(result);
          this.setLoading(false);
        },
        error: (error) => {
          this.setError(`Error generating preview: ${error.message}`);
          this.setLoading(false);
        },
      });
  }

  get acceptedTypes(): string {
    return this.mergedConfig.supportedTypes
      .map((type) => this.getAcceptedExtensions(type))
      .flat()
      .join(',');
  }

  get maxFileSizeMB(): string {
    return (this.mergedConfig.maxFileSize / 1024 / 1024).toFixed(1);
  }

  get supportedTypesText(): string {
    return this.mergedConfig.supportedTypes.join(', ').toUpperCase();
  }

  get canNavigatePrev(): boolean {
    return this.previewType === 'pdf' && this.currentPdfPage > 1;
  }

  get canNavigateNext(): boolean {
    return (
      this.previewType === 'pdf' && this.currentPdfPage < this.totalPdfPages
    );
  }

  get scalePercentage(): string {
    return Math.round(this.currentPdfScale * 100) + '%';
  }

  private processFile(file: File): void {
    // Reset state
    this.errorMessage = '';
    this.previewContent = '';
    this.currentPdfPage = 1;
    this.currentPdfScale = 1.2;
    this.totalPdfPages = 0;

    // Validate file
    const validation = this.fileValidator.validateFile(file, this.mergedConfig);
    if (!validation.isValid) {
      this.setError(validation.error || 'File validation failed');
      return;
    }

    // Get file type
    const fileType = SUPPORTED_MIME_TYPES[file.type] || 'unknown';
    if (!this.mergedConfig.supportedTypes.includes(fileType)) {
      this.setError(`File type ${fileType} is not supported`);
      return;
    }

    this.selectedFile = file;
    this.previewType = fileType;
    this.fileSelected.emit(file);

    if (this.mergedConfig.autoPreview) {
      this.generatePreview(file, fileType);
    }
  }

  private getAcceptedExtensions(type: FileType): string[] {
    const extensionMap: { [key in FileType]: string[] } = {
      pdf: ['.pdf'],
      doc: ['.doc'],
      docx: ['.docx'],
      xls: ['.xls'],
      xlsx: ['.xlsx'],
      csv: ['.csv'],
      txt: ['.txt'],
      json: ['.json'],
      html: ['.html', '.htm'],
      xml: ['.xml'],
      image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      unknown: [],
    };
    return extensionMap[type] || [];
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.error.emit(message);
  }

  private setLoading(loading: boolean): void {
    this.loading = loading;
    this.loadingChanged.emit(loading);
  }
}
