import { TestBed } from '@angular/core/testing';

import { NgUniversalFilePreviewerService } from './ng-universal-file-previewer.service';

describe('NgUniversalFilePreviewerService', () => {
  let service: NgUniversalFilePreviewerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgUniversalFilePreviewerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
