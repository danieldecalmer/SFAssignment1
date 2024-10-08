import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BanAndReportComponent } from './ban-and-report.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

describe('BanAndReportComponent', () => {
  let component: BanAndReportComponent;
  let fixture: ComponentFixture<BanAndReportComponent>;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BanAndReportComponent,
        HttpClientTestingModule, // Use HttpClientTestingModule for HTTP requests
        RouterTestingModule // Use RouterTestingModule for router-related testing
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BanAndReportComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the correct state', () => {
    // Simulate navigation with state
    spyOn(router, 'navigate');
    const state = { username: 'test-user' };
    window.history.pushState(state, '', '');

    fixture.detectChanges();
    expect(component.username).toBe('test-user');
    expect(component.report).toBe('');
  });

  it('should navigate to member-list if no username is in state', () => {
    const navigateSpy = spyOn(router, 'navigate');

    // Clear any state and trigger ngOnInit manually
    window.history.pushState({}, '', '');
    component.ngOnInit();

    expect(navigateSpy).toHaveBeenCalledWith(['member-list']);
  });

  it('should send ban request when onSubmitBan is called', () => {
    // Set up initial values
    component.username = 'test-user';
    component.report = 'Test report';

    // Trigger the ban submission
    component.onSubmitBan();

    // Expect the HTTP request to have been made with the correct data
    const req = httpTestingController.expectOne('http://localhost:3000/ban-user');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'test-user',
      report: 'Test report',
    });

    // Respond to the request to complete it
    req.flush({ message: 'User banned successfully' });

    // Verify navigation after a successful ban
    const navigateSpy = spyOn(router, 'navigate');
    component.onSubmitBan();
    expect(navigateSpy).toHaveBeenCalledWith(['groups']);
  });

  it('should handle error during ban submission', () => {
    spyOn(console, 'error'); // Spy on console.error to check for error handling

    component.username = 'test-user';
    component.report = 'Test report';

    // Trigger the ban submission
    component.onSubmitBan();

    // Simulate a failed HTTP request
    const req = httpTestingController.expectOne('http://localhost:3000/ban-user');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error banning user:', jasmine.anything());
  });

  afterEach(() => {
    httpTestingController.verify(); // Ensure that there are no outstanding HTTP requests
  });
});
