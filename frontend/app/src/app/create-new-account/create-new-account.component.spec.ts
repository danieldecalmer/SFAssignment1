import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateNewAccountComponent } from './create-new-account.component';
import { FormsModule } from '@angular/forms';

describe('CreateNewAccountComponent', () => {
  let component: CreateNewAccountComponent;
  let fixture: ComponentFixture<CreateNewAccountComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      declarations: [CreateNewAccountComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNewAccountComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests remain
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should make a POST request to register a new account', () => {
    // Set form values
    component.email = 'test@example.com';
    component.username = 'testuser';
    component.password = 'password123';

    component.OnCreateAccount();

    const req = httpMock.expectOne('http://localhost:3000/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    });

    req.flush({ message: 'Account created successfully' }); // Simulate a successful response

    expect(component.email).toBe(''); // Check if form fields were reset
    expect(component.username).toBe('');
    expect(component.password).toBe('');
  });

  it('should navigate to login page on successful account creation', () => {
    spyOn(component['router'], 'navigate'); // Spy on the router's navigate method

    component.email = 'test@example.com';
    component.username = 'testuser';
    component.password = 'password123';

    component.OnCreateAccount();

    const req = httpMock.expectOne('http://localhost:3000/register');
    req.flush({ message: 'Account created successfully' }); // Simulate a successful response

    expect(component['router'].navigate).toHaveBeenCalledWith(['login']);
  });

  it('should handle error during account creation', () => {
    spyOn(console, 'error'); // Spy on console.error to verify error handling

    component.email = 'test@example.com';
    component.username = 'testuser';
    component.password = 'password123';

    component.OnCreateAccount();

    const req = httpMock.expectOne('http://localhost:3000/register');
    req.flush('Error creating account', { status: 500, statusText: 'Internal Server Error' }); // Simulate an error response

    expect(console.error).toHaveBeenCalledWith('Error creating account:', jasmine.anything());
  });
});
