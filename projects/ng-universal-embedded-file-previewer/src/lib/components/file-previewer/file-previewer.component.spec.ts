import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilePreviewerComponent } from './file-previewer.component';

describe('FilePreviewerComponent', () => {
  let component: FilePreviewerComponent;
  let fixture: ComponentFixture<FilePreviewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilePreviewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilePreviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
