import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberListComponent } from './member-list.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('MemberListComponent', () => {
  let component: MemberListComponent;
  let fixture: ComponentFixture<MemberListComponent>;
  let httpMock: HttpTestingController;
  let routerSpy = { navigate: jasmine.createSpy('navigate') }; // Spy object for router navigation
  const mockActivatedRoute = {
    paramMap: of({ get: (key: string) => 'test-group' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberListComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the member list component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user session and set group admin status', () => {
    const mockUserData = { username: 'admin', roles: ['super'] };
    component.loadUserSession();

    const req = httpMock.expectOne('http://localhost:3000/user-session');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserData);

    expect(component.loggedInUser).toBe('admin');
    expect(component.isSuperAdmin).toBe(true);
    expect(component.isGroupAdmin).toBe(true);
  });

  it('should load waiting list for the group', () => {
    component.groupName = 'test-group';
    component.loadWaitingList();

    const req = httpMock.expectOne('http://localhost:3000/groups/test-group/waiting-list');
    expect(req.request.method).toBe('GET');
    req.flush(['user1', 'user2']);

    expect(component.waitingList).toEqual(['user1', 'user2']);
  });

  it('should add a member from the waiting list', () => {
    component.groupName = 'test-group';
    component.members = ['member1'];
    component.waitingList = ['waitingUser'];

    component.onAddWaitingListMember('waitingUser');

    const req = httpMock.expectOne('http://localhost:3000/groups/test-group/add-member');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'User added successfully' });

    expect(component.members).toContain('waitingUser');
    expect(component.waitingList).not.toContain('waitingUser');
  });

  it('should remove the logged-in user from the group', () => {
    component.groupName = 'test-group';
    component.loggedInUser = 'test-user';
    component.isSuperAdmin = false;

    component.onLeaveGroup();

    const req = httpMock.expectOne('http://localhost:3000/groups/test-group/leave');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'User left the group successfully' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['groups']);
  });

  it('should navigate to Ban and Report page', () => {
    component.onBanAndReport('user1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['ban-and-report'], { state: { username: 'user1' } });
  });

  it('should load users who are not part of the group', () => {
    component.members = ['member1'];
    const mockUsers = [{ username: 'user1' }, { username: 'member1' }, { username: 'user2' }];
    component.loadOtherUsers();

    const req = httpMock.expectOne('http://localhost:3000/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);

    expect(component.otherUsers).toEqual([{ username: 'user1' }, { username: 'user2' }]);
  });
});
