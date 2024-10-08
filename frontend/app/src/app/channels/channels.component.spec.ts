import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ChannelsComponent } from './channels.component';

describe('ChannelsComponent', () => {
  let component: ChannelsComponent;
  let fixture: ComponentFixture<ChannelsComponent>;
  let httpMock: HttpTestingController;
  let mockRouter: Router;
  let mockActivatedRoute: ActivatedRoute;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ChannelsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => (key === 'groupName' ? 'test-group' : null) }),
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'groupName' ? 'test-group' : null)
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChannelsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    mockRouter = TestBed.inject(Router);
    mockActivatedRoute = TestBed.inject(ActivatedRoute);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests remain
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user session and determine group admin status', () => {
    const mockUserData = { username: 'adminUser' };
    const mockGroupData = { groupAdmins: ['adminUser'], channels: ['general', 'random'] };

    component.group = mockGroupData;
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3000/user-session');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserData);

    expect(component.loggedInUser).toEqual('adminUser');
    expect(component.isGroupAdmin).toBeTrue();
  });

  it('should fetch group details when not passed in state', () => {
    const mockGroupData = { name: 'test-group', channels: ['general', 'random'] };

    component.fetchGroupDetails('test-group');

    const req = httpMock.expectOne('http://localhost:3000/groups/test-group');
    expect(req.request.method).toBe('GET');
    req.flush(mockGroupData);

    expect(component.group).toEqual(mockGroupData);
    expect(component.channels).toEqual(mockGroupData.channels);
  });

  it('should delete a channel if confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true); // Simulate confirm dialog
    component.group = { name: 'test-group', channels: ['general', 'random'] };
    component.channels = ['general', 'random'];

    component.onDeleteChannel('general');

    const req = httpMock.expectOne('http://localhost:3000/groups/test-group/channels/general');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Channel deleted successfully' });

    expect(component.channels).toEqual(['random']);
  });

  it('should not delete a channel if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false); // Simulate canceling confirm dialog
    component.channels = ['general', 'random'];

    component.onDeleteChannel('general');

    httpMock.expectNone('http://localhost:3000/groups/test-group/channels/general');
    expect(component.channels).toEqual(['general', 'random']); // Channels list should remain the same
  });

  it('should navigate to chat when onChannelClick is called', () => {
    spyOn(mockRouter, 'navigate');

    component.onChannelClick('general');

    expect(mockRouter.navigate).toHaveBeenCalledWith(['chat'], {
      state: { group: component.group, channel: 'general' }
    });
  });

  it('should navigate to create new channel page when onClickCreateNewChannel is called', () => {
    spyOn(mockRouter, 'navigate');

    component.onClickCreateNewChannel();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['create-new-channel'], {
      state: { group: component.group }
    });
  });

  it('should navigate back to groups page when onBackToGroups is called', () => {
    spyOn(mockRouter, 'navigate');

    component.onBackToGroups();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['groups']);
  });
});
