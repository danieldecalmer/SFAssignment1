import { Component, OnInit, OnDestroy } from '@angular/core';
import Peer from 'peerjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  templateUrl: './video-chat.component.html',
  imports: [FormsModule],
  styleUrls: ['./video-chat.component.css']
})
export class VideoChatComponent implements OnInit, OnDestroy {
  peer: Peer | null = null;  // The peer instance
  localStream: MediaStream | null = null;  // Local video stream
  connections: any[] = [];  // Array to store peer connections
  remoteStreams: { [id: string]: MediaStream } = {}; // Store remote streams by peer ID
  peerId: string = ''; // The peer ID for the user
  channelId: string = 'channel-room-id'; // Channel or room identifier for video chat

  constructor() {}

  ngOnInit(): void {
    this.initializePeer();
  }

  // Initialize PeerJS and automatically join the channel
  initializePeer() {
    // Create a new Peer instance
    this.peer = new Peer({ host: 'localhost', port: 9000, path: '/' });

    // Get the peer ID once the peer is open
    this.peer.on('open', (id) => {
      this.peerId = id;
      console.log(`My peer ID is: ${this.peerId}`);
      this.joinVideoChat();
    });

    // Handle incoming calls from other peers
    this.peer.on('call', (call) => {
      console.log(`Receiving a call from peer ID: ${call.peer}`);
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        this.localStream = stream;
        this.displayLocalStream(stream);
        call.answer(stream); // Answer the call with local stream

        // Listen for the remote stream and display it
        call.on('stream', (remoteStream) => {
          console.log(`Received remote stream from peer ID: ${call.peer}`);
          this.remoteStreams[call.peer] = remoteStream;
          this.displayRemoteStream(remoteStream, call.peer);
        });
      });
    });
  }

  // Join the video chat by calling all existing peers in the channel
  joinVideoChat() {
    if (this.peer) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        this.localStream = stream;
        this.displayLocalStream(stream);

        // Fetch the list of peers currently connected to the channel
        this.peer?.listAllPeers((peers) => {
          console.log('Peers in the channel:', peers);
          peers.forEach((peerId) => {
            if (peerId !== this.peerId) { // Avoid calling yourself
              console.log(`Calling peer ID: ${peerId}`);
              const call = this.peer!.call(peerId, stream);
              this.connections.push(call);

              // Listen for the remote stream
              call.on('stream', (remoteStream) => {
                console.log(`Connected to remote peer ID: ${peerId}`);
                this.remoteStreams[peerId] = remoteStream;
                this.displayRemoteStream(remoteStream, peerId);
              });
            }
          });
        });
      }).catch((error) => {
        console.error('Error accessing local media:', error);
      });
    }
  }

  // Display the local video stream
  displayLocalStream(stream: MediaStream) {
    const localVideo = document.getElementById('local-video') as HTMLVideoElement;
    localVideo.srcObject = stream;
    localVideo.play();
  }

  // Display a remote video stream
  displayRemoteStream(stream: MediaStream, peerId: string) {
    let remoteVideo = document.getElementById(`remote-video-${peerId}`) as HTMLVideoElement;

    // If the remote video element doesn't exist yet, create it
    if (!remoteVideo) {
      const videoContainer = document.getElementById('remote-video-container');
      remoteVideo = document.createElement('video');
      remoteVideo.setAttribute('id', `remote-video-${peerId}`);
      remoteVideo.setAttribute('autoplay', 'true');
      remoteVideo.setAttribute('playsinline', 'true');
      remoteVideo.style.width = '300px';
      remoteVideo.style.height = '200px';
      videoContainer?.appendChild(remoteVideo);
    }

    remoteVideo.srcObject = stream;
    remoteVideo.play();
  }

  // Clean up when the component is destroyed
  ngOnDestroy(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop()); // Stop local stream
    }
    this.connections.forEach((conn) => conn.close()); // Close all peer connections
    if (this.peer) {
      this.peer.destroy(); // Destroy the peer connection
    }
  }
}
