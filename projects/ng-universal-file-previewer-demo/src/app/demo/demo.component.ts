import { Component } from '@angular/core';
import {
  FilePreviewConfig,
  FilePreviewResult,
} from '../../../../../projects/ng-universal-file-previewer/src/lib/models/file-types';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss'],
})
export class DemoComponent {
  config: Partial<FilePreviewConfig> = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedTypes: ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'image'],
    theme: 'light',
    showFileInfo: true,
    autoPreview: true,
  };

  selectedTheme: 'light' | 'dark' = 'light';
  maxSizeMB = 10;
  autoPreview = true;
  showFileInfo = true;

  onFileSelected(file: File): void {
    console.log('Demo: File selected', file);
  }

  onPreviewReady(result: FilePreviewResult): void {
    console.log('Demo: Preview ready', result);
  }

  onError(error: string): void {
    console.error('Demo: Error occurred', error);
    alert(`Error: ${error}`);
  }

  updateConfig(): void {
    this.config = {
      ...this.config,
      maxFileSize: this.maxSizeMB * 1024 * 1024,
      theme: this.selectedTheme,
      autoPreview: this.autoPreview,
      showFileInfo: this.showFileInfo,
    };
  }
}
