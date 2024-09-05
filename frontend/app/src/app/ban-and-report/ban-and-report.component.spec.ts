import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BanAndReportComponent } from './ban-and-report.component';

describe('BanAndReportComponent', () => {
  let component: BanAndReportComponent;
  let fixture: ComponentFixture<BanAndReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BanAndReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BanAndReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
