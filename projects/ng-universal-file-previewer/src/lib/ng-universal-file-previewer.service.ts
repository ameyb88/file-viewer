import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { FileProcessorService } from './services/file-processor.service';
import { FileValidatorService } from './services/file-validator.service';
import {
  FilePreviewConfig,
  FilePreviewResult,
  DEFAULT_CONFIG,
  SUPPORTED_MIME_TYPES,
  FileType,
} from './models/file-types';

@Injectable({
  providedIn: 'root',
})
export class NgUniversalFilePreviewerService {
  private configSubject = new BehaviorSubject<Required<FilePreviewConfig>>(
    DEFAULT_CONFIG
  );
  public config$ = this.configSubject.asObservable();

  constructor(
    private fileProcessor: FileProcessorService,
    private fileValidator: FileValidatorService
  ) {}

  setGlobalConfig(config: Partial<FilePreviewConfig>): void {
    const mergedConfig = { ...this.configSubject.value, ...config };
    this.configSubject.next(mergedConfig);
  }

  getGlobalConfig(): Required<FilePreviewConfig> {
    return this.configSubject.value;
  }

  processFile(file: File): Observable<FilePreviewResult> {
    const config = this.configSubject.value;
    const validation = this.fileValidator.validateFile(file, config);

    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed');
    }

    const fileType = this.getFileType(file);
    return this.fileProcessor.processFile(file, fileType);
  }

  validateFile(file: File, config?: Partial<FilePreviewConfig>) {
    const mergedConfig = { ...this.configSubject.value, ...config };
    return this.fileValidator.validateFile(file, mergedConfig);
  }

  registerCustomProcessor(
    type: FileType,
    processor: (file: File) => Promise<string>
  ): void {
    this.fileProcessor.registerCustomProcessor(type, processor);
  }

  private getFileType(file: File): FileType {
    return SUPPORTED_MIME_TYPES[file.type] || 'unknown';
  }
}
