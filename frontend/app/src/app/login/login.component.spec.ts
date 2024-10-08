import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let routerSpy = { navigate: jasmine.createSpy('navigate') }; // Spy object for router navigation

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, FormsModule],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the login component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to create-new-account on OnCreateNewAccount()', () => {
    component.OnCreateNewAccount();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['create-new-account']);
  });

  it('should log in successfully and navigate to groups page', () => {
    component.username = 'testuser';
    component.password = 'testpassword';
    component.OnLogin();

    const req = httpMock.expectOne('http://localhost:3000/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'testuser', password: 'testpassword' });

    req.flush({ message: 'logged in successfully', user: { id: '1', username: 'testuser', roles: ['user'], groups: [] } });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['groups']);
    expect(component.errorMessage).toBe('');
  });

  it('should handle failed login attempt', () => {
    component.username = 'wronguser';
    component.password = 'wrongpassword';
    component.OnLogin();

    const req = httpMock.expectOne('http://localhost:3000/login');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'login failed' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.errorMessage).toBe('An error occurred during login. Please try again later.');
  });

  it('should display error message on server error', () => {
    component.username = 'serverErrorUser';
    component.password = 'serverErrorPass';
    component.OnLogin();

    const req = httpMock.expectOne('http://localhost:3000/login');
    expect(req.request.method).toBe('POST');
    req.error(new ErrorEvent('Network error'));

    expect(component.errorMessage).toBe('An error occurred during login. Please try again later.');
  });
});
