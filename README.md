# NG Universal File Previewer

A powerful, universal file previewer library for Angular applications with support for PDF, images, documents, spreadsheets, and more.

## ✨ Features

- 📄 **PDF Preview** with page navigation and zoom controls
- 🖼️ **Image Preview** with zoom and full-size view
- 📊 **Excel/CSV** data table preview
- 📝 **Word Document** preview (DOCX)
- 🎨 **Modern UI** with light/dark theme support
- 📱 **Responsive Design** - works on mobile and desktop
- 🔧 **Highly Configurable** with custom processors
- 🚀 **Easy Integration** - just add one component

## 🚀 Quick Start

### Installation

```bash
npm install ng-universal-file-previewer
```

### Import the Module

```typescript
import { NgUniversalFilePreviewerModule } from 'ng-universal-file-previewer';

@NgModule({
  imports: [
    NgUniversalFilePreviewerModule
  ]
})
export class AppModule { }
```

### Basic Usage

```html
<ngx-file-previewer
  [config]="previewConfig"
  [theme]="'light'"
  (fileSelected)="onFileSelected($event)"
  (previewReady)="onPreviewReady($event)">
</ngx-file-previewer>
```

```typescript
export class AppComponent {
  previewConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedTypes: ['pdf', 'image', 'docx', 'xlsx', 'csv', 'txt'],
    autoPreview: true
  };

  onFileSelected(file: File) {
    console.log('File selected:', file.name);
  }

  onPreviewReady(result: any) {
    console.log('Preview ready:', result);
  }
}
```

## 📖 Documentation

### Supported File Types

- **PDF**: Full rendering with page navigation and zoom
- **Images**: PNG, JPEG, GIF, WebP, SVG
- **Documents**: DOCX (with full content rendering)
- **Spreadsheets**: XLSX, XLS, CSV
- **Text**: TXT, JSON, HTML, XML

### Configuration Options

```typescript
interface FilePreviewConfig {
  maxFileSize: number;           // Maximum file size in bytes
  supportedTypes: FileType[];    // Array of supported file types
  autoPreview: boolean;          // Auto-generate preview on file selection
  showFileInfo: boolean;         // Show file information panel
}
```

### Theming

The library supports both light and dark themes:

```html
<ngx-file-previewer [theme]="'dark'"></ngx-file-previewer>
```

### Custom Styling

Add custom CSS classes:

```html
<ngx-file-previewer [customClass]="'my-custom-preview'"></ngx-file-previewer>
```

## 🔧 Advanced Usage

### Custom File Processors

```typescript
import { FileProcessorService } from 'ng-universal-file-previewer';

constructor(private fileProcessor: FileProcessorService) {
  // Register custom processor for a file type
  this.fileProcessor.registerCustomProcessor('custom', async (file: File) => {
    return '<div>Custom preview content</div>';
  });
}
```

## 📦 Dependencies

- `@angular/core` (^17.0.0)
- `@angular/common` (^17.0.0)
- `pdfjs-dist` (^3.4.120)
- `mammoth` (^1.6.0)
- `xlsx` (^0.18.5)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🐛 Issues

Report issues on [GitHub Issues](https://github.com/yourusername/ng-universal-file-previewer/issues)
