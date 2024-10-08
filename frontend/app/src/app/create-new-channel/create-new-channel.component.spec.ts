import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateNewChannelComponent } from './create-new-channel.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

describe('CreateNewChannelComponent', () => {
  let component: CreateNewChannelComponent;
  let fixture: ComponentFixture<CreateNewChannelComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      declarations: [CreateNewChannelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateNewChannelComponent);
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

  it('should initialize with the group data from the state', () => {
    const mockGroup = { name: 'Test Group', channels: ['General', 'Random'] };
    window.history.pushState({ group: mockGroup }, '', '');

    component.ngOnInit();
    expect(component.group).toEqual(mockGroup);
    expect(component.channels).toEqual(mockGroup.channels);
  });

  it('should log error and navigate to groups if group data is missing', () => {
    spyOn(console, 'error');
    spyOn(router, 'navigate');

    window.history.pushState({}, '', ''); // Clear state to simulate missing group data
    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith('Group object is not provided or does not contain channels!');
    expect(router.navigate).toHaveBeenCalledWith(['groups']);
  });

  it('should make a POST request to create a new channel', () => {
    const mockGroup = { name: 'Test Group', channels: ['General', 'Random'] };
    component.group = mockGroup;
    component.channelName = 'New Channel';

    component.onSubmit();

    const req = httpMock.expectOne(`http://localhost:3000/groups/${mockGroup.name}/channels`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ channel: 'New Channel' });

    req.flush({ message: 'Channel created successfully' });

    expect(component.group.channels).toContain('New Channel'); // Verify that the channel list was updated
  });

  it('should handle error when creating a new channel', () => {
    spyOn(console, 'error');
    const mockGroup = { name: 'Test Group', channels: ['General', 'Random'] };
    component.group = mockGroup;
    component.channelName = 'New Channel';

    component.onSubmit();

    const req = httpMock.expectOne(`http://localhost:3000/groups/${mockGroup.name}/channels`);
    req.flush('Error creating channel', { status: 500, statusText: 'Internal Server Error' });

    expect(console.error).toHaveBeenCalledWith('Error creating channel:', jasmine.anything());
  });

  it('should navigate back to channels when onBackToChannels is called', () => {
    spyOn(router, 'navigate');
    const mockGroup = { name: 'Test Group', channels: ['General', 'Random'] };
    component.group = mockGroup;

    component.onBackToChannels();

    expect(router.navigate).toHaveBeenCalledWith(['channels'], { state: { group: mockGroup } });
  });
});
