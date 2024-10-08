import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateNewGroupComponent } from './create-new-group.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

describe('CreateNewGroupComponent', () => {
  let component: CreateNewGroupComponent;
  let fixture: ComponentFixture<CreateNewGroupComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      declarations: [CreateNewGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNewGroupComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // Ensure that there are no outstanding HTTP requests
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user session and set the logged-in user', () => {
    const mockUserData = { username: 'testUser' };
    
    const req = httpMock.expectOne('http://localhost:3000/user-session');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserData);

    expect(component.loggedInUser).toBe(mockUserData.username);
  });

  it('should handle error when loading user session', () => {
    spyOn(console, 'error');
    
    const req = httpMock.expectOne('http://localhost:3000/user-session');
    req.flush('Error loading user session', { status: 500, statusText: 'Internal Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error loading user session:', jasmine.anything());
  });

  it('should create a new group and navigate to groups page', () => {
    spyOn(router, 'navigate');
    component.groupName = 'New Test Group';
    component.loggedInUser = 'testUser';

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:3000/groups');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'New Test Group',
      channels: [],
      members: ['testUser'],
      groupAdmin: 'testUser'
    });

    req.flush({ message: 'Group created successfully' });

    expect(router.navigate).toHaveBeenCalledWith(['groups'], { state: { reload: true } });
  });

  it('should handle error when creating a new group', () => {
    spyOn(console, 'error');
    component.groupName = 'New Test Group';
    component.loggedInUser = 'testUser';

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:3000/groups');
    req.flush('Error creating group', { status: 500, statusText: 'Internal Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error creating group:', jasmine.anything());
  });

  it('should navigate back to groups when onBackToGroups is called', () => {
    spyOn(router, 'navigate');

    component.onBackToGroups();

    expect(router.navigate).toHaveBeenCalledWith(['groups']);
  });
});
