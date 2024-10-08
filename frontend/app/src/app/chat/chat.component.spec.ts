import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ChatComponent } from './chat.component';
import { io, Socket } from 'socket.io-client'; // Import Socket.io mock

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let httpMock: HttpTestingController;
  let mockRouter: Router;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    // Mock the Socket.io object to prevent actual network calls
    mockSocket = {
      on: jasmine.createSpy('on'),
      emit: jasmine.createSpy('emit'),
      disconnect: jasmine.createSpy('disconnect'),
    };

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ChatComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => (key === 'group' ? 'test-group' : null) }),
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'group' ? 'test-group' : null),
              },
            },
          },
        },
        { provide: Socket, useValue: mockSocket },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    mockRouter = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests remain
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load user session on initialization', () => {
    const mockUserData = { username: 'test-user' };

    const req = httpMock.expectOne('http://localhost:3000/user-session');
    expect(req.request.method).toBe('GET');
    req.flush(mockUserData);

    expect(component.loggedInUser).toEqual('test-user');
  });

  it('should handle sending a text message', () => {
    component.newMessage = 'Hello, World!';
    component.group = { name: 'test-group' };
    component.channel = 'general';

    component.sendMessage();

    expect(mockSocket.emit).toHaveBeenCalledWith('message', {
      group: 'test-group',
      channel: 'general',
      sender: component.loggedInUser,
      message: 'Hello, World!',
      timestamp: jasmine.any(Date),
    });
    expect(component.newMessage).toBe('');
  });

  it('should handle file selection', () => {
    const mockFile = new File([''], 'test-file.png', { type: 'image/png' });
    const event = { target: { files: [mockFile] } };

    component.onFileSelected(event as any);

    expect(component.selectedFile).toBe(mockFile);
  });

  it('should handle sending an image message', () => {
    const mockFile = new File([''], 'test-file.png', { type: 'image/png' });
    component.selectedFile = mockFile;
    component.group = { name: 'test-group' };
    component.channel = 'general';
    component.loggedInUser = 'test-user';

    component.sendMessage();

    const req = httpMock.expectOne('http://localhost:3000/upload-image');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.has('file')).toBeTrue();
    expect(req.request.body.has('group')).toBeTrue();
    expect(req.request.body.has('channel')).toBeTrue();
    expect(req.request.body.has('sender')).toBeTrue();
    req.flush({});

    expect(component.selectedFile).toBeNull();
  });

  it('should navigate back to channels', () => {
    spyOn(mockRouter, 'navigate');

    component.onBackToChannels();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['channels'], {
      state: { group: component.group },
    });
  });

  it('should navigate to video chat when startVideoChat is called', () => {
    spyOn(mockRouter, 'navigate');

    component.startVideoChat();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/video-chat'], {
      state: { group: component.group, channel: component.channel },
    });
  });

  it('should disconnect the socket on component destroy', () => {
    component.ngOnDestroy();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
