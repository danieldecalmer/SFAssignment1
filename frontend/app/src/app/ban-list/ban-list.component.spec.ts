import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BanListComponent } from './ban-list.component';

describe('BanListComponent', () => {
  let component: BanListComponent;
  let fixture: ComponentFixture<BanListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, BanListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BanListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController); // Inject the HttpTestingController
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched HTTP requests are outstanding
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load banned users on initialization', () => {
    // Define mock response data
    const mockBannedUsers = [{ username: 'user1' }, { username: 'user2' }];

    // Trigger the HTTP request
    const req = httpMock.expectOne('http://localhost:3000/banned-users');
    expect(req.request.method).toBe('GET');
    req.flush(mockBannedUsers); // Respond with mock data

    // Check if the banned users were loaded correctly
    expect(component.bannedUsers).toEqual(mockBannedUsers);
  });

  it('should unban a user and remove them from the bannedUsers list', () => {
    // Define initial mock banned users
    component.bannedUsers = [{ username: 'user1' }, { username: 'user2' }];
    fixture.detectChanges();

    // Call the unbanUser method
    component.unbanUser('user1');

    // Expect an HTTP POST request to the unban endpoint
    const req = httpMock.expectOne('http://localhost:3000/unban-user');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'user1' });

    // Mock the server response for unbanning
    req.flush({ message: 'User unbanned successfully' });

    // Check if the user was removed from the bannedUsers list
    expect(component.bannedUsers).toEqual([{ username: 'user2' }]);
  });

  it('should handle error when loading banned users', () => {
    spyOn(console, 'error'); // Spy on console.error to check if it gets called

    // Trigger the HTTP request
    const req = httpMock.expectOne('http://localhost:3000/banned-users');
    expect(req.request.method).toBe('GET');

    // Simulate an error response from the server
    req.error(new ErrorEvent('Network error'));

    // Check if the error is logged to the console
    expect(console.error).toHaveBeenCalledWith('Error loading banned users:', jasmine.anything());
  });

  it('should handle error when unbanning a user', () => {
    spyOn(console, 'error'); // Spy on console.error to check if it gets called

    // Call the unbanUser method
    component.unbanUser('user1');

    // Expect an HTTP POST request to the unban endpoint
    const req = httpMock.expectOne('http://localhost:3000/unban-user');
    expect(req.request.method).toBe('POST');

    // Simulate an error response from the server
    req.error(new ErrorEvent('Network error'));

    // Check if the error is logged to the console
    expect(console.error).toHaveBeenCalledWith('Error unbanning user:', jasmine.anything());
  });
});
