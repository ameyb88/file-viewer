import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgUniversalFilePreviewerComponent } from './ng-universal-file-previewer.component';

describe('NgUniversalFilePreviewerComponent', () => {
  let component: NgUniversalFilePreviewerComponent;
  let fixture: ComponentFixture<NgUniversalFilePreviewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgUniversalFilePreviewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgUniversalFilePreviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
