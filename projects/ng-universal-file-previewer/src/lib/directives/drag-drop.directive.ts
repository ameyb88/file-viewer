import {
  Directive,
  Output,
  EventEmitter,
  HostListener,
  HostBinding,
} from '@angular/core';

@Directive({
  selector: '[ngxDragDrop]',
  standalone: true,
})
export class DragDropDirective {
  @Output() fileDropped = new EventEmitter<FileList>();
  @Output() dragOver = new EventEmitter<DragEvent>();
  @Output() dragLeave = new EventEmitter<DragEvent>();

  @HostBinding('class.drag-over') private dragOverClass = false;

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = true;
    this.dragOver.emit(event);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = false;
    this.dragLeave.emit(event);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverClass = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}
