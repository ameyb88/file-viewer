import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FilePreviewerComponent } from './components/file-previewer/file-previewer.component';
import { FileSizePipe } from './pipes/file-size.pipe';
import { DragDropDirective } from './directives/drag-drop.directive';

@NgModule({
  declarations: [FilePreviewerComponent],
  imports: [CommonModule, FormsModule, FileSizePipe, DragDropDirective],
  exports: [FilePreviewerComponent, FileSizePipe, DragDropDirective],
})
export class NgUniversalFilePreviewerModule {}
