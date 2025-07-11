// projects/ng-universal-file-previewer/src/lib/components/file-previewer/file-previewer.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
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
  // Input properties - THESE WERE MISSING!
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

  private destroy$ = new Subject<void>();
  mergedConfig: Required<FilePreviewConfig> = DEFAULT_CONFIG;

  constructor(
    private fileProcessor: FileProcessorService,
    private fileValidator: FileValidatorService
  ) {}

  ngOnInit(): void {
    this.mergedConfig = { ...DEFAULT_CONFIG, ...this.config };

    // Listen for PDF navigation events
    this.setupPdfNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up PDF navigation listeners
    this.cleanupPdfNavigation();
  }

  private setupPdfNavigation(): void {
    // Listen for PDF page change events
    window.addEventListener(
      'pdf-page-change',
      this.handlePdfPageChange.bind(this)
    );
    window.addEventListener(
      'pdf-scale-change',
      this.handlePdfScaleChange.bind(this)
    );
  }

  private cleanupPdfNavigation(): void {
    window.removeEventListener(
      'pdf-page-change',
      this.handlePdfPageChange.bind(this)
    );
    window.removeEventListener(
      'pdf-scale-change',
      this.handlePdfScaleChange.bind(this)
    );
  }

  private handlePdfPageChange(event: any): void {
    const { page, fileName } = event.detail;

    // Check if this event is for the current file
    if (
      this.selectedFile &&
      this.selectedFile.name === fileName &&
      this.previewType === 'pdf'
    ) {
      this.setLoading(true);

      // Re-render PDF with new page
      this.fileProcessor
        .processFile(this.selectedFile, 'pdf')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result: FilePreviewResult) => {
            // Override the result to show the requested page
            this.renderPdfPage(this.selectedFile!, page);
          },
          error: (error) => {
            this.setError(`Error navigating PDF: ${error.message}`);
            this.setLoading(false);
          },
        });
    }
  }

  private handlePdfScaleChange(event: any): void {
    const { scale, page, fileName } = event.detail;

    // Check if this event is for the current file
    if (
      this.selectedFile &&
      this.selectedFile.name === fileName &&
      this.previewType === 'pdf'
    ) {
      this.setLoading(true);
      this.renderPdfPage(this.selectedFile, page, scale);
    }
  }

  private renderPdfPage(
    file: File,
    pageNumber: number,
    scale: number = 1.2
  ): void {
    // Create a custom observable for PDF page rendering
    this.fileProcessor
      .renderPdfPage(file, pageNumber, scale)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (content: string) => {
          this.previewContent = content;
          this.setLoading(false);
        },
        error: (error) => {
          this.setError(`Error rendering PDF page: ${error.message}`);
          this.setLoading(false);
        },
      });
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
  }

  generatePreview(file?: File, fileType?: FileType): void {
    const targetFile = file || this.selectedFile;
    const targetType = fileType || this.previewType;

    if (!targetFile || !targetType) {
      this.setError('No file selected for preview');
      return;
    }

    this.setLoading(true);

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

  private processFile(file: File): void {
    // Reset state
    this.errorMessage = '';
    this.previewContent = '';

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
