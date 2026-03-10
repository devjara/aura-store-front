import { TestBed } from '@angular/core/testing';

import { PrestashopApi } from './prestashop-api';

describe('PrestashopApi', () => {
  let service: PrestashopApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrestashopApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
