import { Injectable } from '@angular/core';
import { FilePreviewConfig, SUPPORTED_MIME_TYPES } from '../models/file-types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FileValidatorService {
  constructor() {}

  validateFile(file: File, config: FilePreviewConfig): ValidationResult {
    // Check file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(
          2
        )}MB) exceeds maximum allowed size (${(
          config.maxFileSize /
          1024 /
          1024
        ).toFixed(2)}MB)`,
      };
    }

    // Check file type
    const fileType = SUPPORTED_MIME_TYPES[file.type];
    if (!fileType) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}`,
      };
    }

    // Check if file type is in supported types
    if (config.supportedTypes && !config.supportedTypes.includes(fileType)) {
      return {
        isValid: false,
        error: `File type '${fileType}' is not supported. Supported types: ${config.supportedTypes.join(
          ', '
        )}`,
      };
    }

    // Check file name
    if (!file.name || file.name.trim() === '') {
      return {
        isValid: false,
        error: 'Invalid file name',
      };
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension '${fileExtension}' is not allowed for security reasons`,
      };
    }

    return { isValid: true };
  }

  validateMultipleFiles(
    files: FileList,
    config: FilePreviewConfig
  ): ValidationResult {
    if (!config.allowMultipleFiles && files.length > 1) {
      return {
        isValid: false,
        error: 'Multiple files are not allowed',
      };
    }

    for (let i = 0; i < files.length; i++) {
      const validation = this.validateFile(files[i], config);
      if (!validation.isValid) {
        return {
          isValid: false,
          error: `File ${i + 1}: ${validation.error}`,
        };
      }
    }

    return { isValid: true };
  }
}
