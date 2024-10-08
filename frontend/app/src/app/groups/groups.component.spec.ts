import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GroupsComponent } from './groups.component';
import { Router } from '@angular/router';

describe('GroupsComponent', () => {
  let component: GroupsComponent;
  let fixture: ComponentFixture<GroupsComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [GroupsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user and groups data on initialization', () => {
    const mockUserData = { username: 'testUser', roles: ['group'], profilePicture: '' };
    const mockGroupsData = [
      { name: 'Group 1', members: ['testUser'], groupAdmins: ['testUser'] },
      { name: 'Group 2', members: [], groupAdmins: [] }
    ];

    const userReq = httpMock.expectOne('http://localhost:3000/user-session');
    expect(userReq.request.method).toBe('GET');
    userReq.flush(mockUserData);

    const groupsReq = httpMock.expectOne('http://localhost:3000/groups');
    expect(groupsReq.request.method).toBe('GET');
    groupsReq.flush(mockGroupsData);

    expect(component.user).toEqual(mockUserData);
    expect(component.userGroups.length).toBe(1);
    expect(component.otherGroups.length).toBe(1);
  });

  it('should handle error when loading user session', () => {
    spyOn(console, 'error');
    const userReq = httpMock.expectOne('http://localhost:3000/user-session');
    userReq.flush('Error loading user session', { status: 500, statusText: 'Internal Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error loading user session:', jasmine.anything());
  });

  it('should handle error when loading groups', () => {
    spyOn(console, 'error');
    const groupsReq = httpMock.expectOne('http://localhost:3000/groups');
    groupsReq.flush('Error loading groups', { status: 500, statusText: 'Internal Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error loading groups:', jasmine.anything());
  });

  it('should allow creating a group if the user has permissions', () => {
    component.user = { roles: ['group'] };
    component.checkUserPermissions();
    expect(component.canCreateGroup).toBeTrue();
  });

  it('should navigate to create new group page when createNewGroup is called', () => {
    spyOn(router, 'navigate');
    component.createNewGroup();
    expect(router.navigate).toHaveBeenCalledWith(['create-new-group']);
  });

  it('should handle group deletion and refresh the list of groups', () => {
    spyOn(component, 'loadGroups');
    component.user = { username: 'testUser', roles: ['super'] };
    const groupToDelete = { name: 'Group 1', groupAdmins: ['testUser'] };

    component.deleteGroup(groupToDelete);

    const req = httpMock.expectOne(`http://localhost:3000/groups/${groupToDelete.name}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Group deleted successfully' });

    expect(component.loadGroups).toHaveBeenCalled();
  });

  it('should handle account deletion and navigate to login page', () => {
    spyOn(router, 'navigate');
    component.user = { username: 'testUser', roles: [] };

    component.deleteAccount();

    const req = httpMock.expectOne('http://localhost:3000/delete-account');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Account deleted successfully' });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle error during profile picture update', () => {
    spyOn(console, 'error');

    component.changeProfilePicture();
    const req = httpMock.expectOne('http://localhost:3000/upload-profile-picture');
    req.flush('Error uploading profile picture', { status: 500, statusText: 'Internal Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error uploading profile picture:', jasmine.anything());
  });
});
