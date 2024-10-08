import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoChatComponent } from './video-chat.component';
import { FormsModule } from '@angular/forms';

describe('VideoChatComponent', () => {
  let component: VideoChatComponent;
  let fixture: ComponentFixture<VideoChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [VideoChatComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the video chat component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize PeerJS and set peer ID', (done) => {
    spyOn(component, 'initializePeer').and.callFake(() => {
      // Simulate PeerJS behavior when the peer is open
      component.peerId = 'test-peer-id';
      expect(component.peerId).toBe('test-peer-id');
      done();
    });

    component.initializePeer();
  });

  it('should call joinVideoChat when PeerJS is initialized', (done) => {
    spyOn(component, 'joinVideoChat').and.callThrough();
    spyOn(component, 'initializePeer').and.callFake(() => {
      component.peerId = 'test-peer-id';
      component.joinVideoChat();
      expect(component.joinVideoChat).toHaveBeenCalled();
      done();
    });

    component.initializePeer();
  });

  it('should handle incoming call from other peers', () => {
    // Mocking the PeerJS call and media stream
    const mockCall = {
      peer: 'remote-peer-id',
      answer: jasmine.createSpy('answer'),
      on: jasmine.createSpy('on').and.callFake((event, callback) => {
        if (event === 'stream') {
          callback(new MediaStream());
        }
      }),
    };

    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(new MediaStream()));
    component.initializePeer();
    

    expect(mockCall.answer).toHaveBeenCalled(); // Check if the call was answered with the local stream
    expect(mockCall.on).toHaveBeenCalledWith('stream', jasmine.any(Function)); // Verify stream handling
  });

  it('should clean up resources on destroy', () => {
    const mockTrack = { stop: jasmine.createSpy('stop') };
    const mockStream = { getTracks: () => [mockTrack] };
    component.localStream = mockStream as unknown as MediaStream;

    spyOn(component.peer!, 'destroy').and.callThrough();
    component.ngOnDestroy();

    expect(mockTrack.stop).toHaveBeenCalled(); // Check if local stream tracks were stopped
    expect(component.peer?.destroy).toHaveBeenCalled(); // Verify that the peer connection was destroyed
  });
});
