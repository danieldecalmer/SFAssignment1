import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationExtras } from '@angular/router';
import { io, Socket } from 'socket.io-client'; // Import Socket.io
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  group: any = {};
  channel: string = '';
  socket!: Socket; // Socket instance
  messages: any[] = []; // To store chat messages
  newMessage: string = ''; // Model for the new message input
  loggedInUser: string = ''; // Track the logged-in user
  selectedFile: File | null = null; // Store selected image file for upload

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient // Inject HttpClient
  ) {
    this.socket = io('http://localhost:3000'); // Connect to the server
  }

  ngOnInit(): void {
    this.loadUserSession();

    this.route.paramMap.subscribe(() => {
      const group = window.history.state.group;
      const channel = window.history.state.channel;
      if (group && channel) {
        this.group = group;
        this.channel = channel;

        // Emit group and channel info to join the correct channel
        this.socket.emit('joinChannel', { group: this.group.name, channel: this.channel });

        // Listen for chat history
        this.socket.on('chat-history', (history: any[]) => {
          this.messages = history;
        });

        // Listen for new messages
        this.socket.on('new-message', (message: any) => {
          this.messages.push(message); // Append new message to chat
        });
      }
    });
  }

  // Load user session data from the backend
  loadUserSession() {
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.loggedInUser = userData.username; // Set the logged-in user's username
        console.log('User session loaded:', userData);
      },
      error: (error) => {
        console.error('Error loading user session:', error);
        this.router.navigate(['/login']); // Redirect to login if user is not logged in
      }
    });
  }

  // Handle file selection (image upload)
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Handle sending messages (both text and image)
  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('group', this.group.name);
        formData.append('channel', this.channel);
        formData.append('sender', this.loggedInUser);
        formData.append('timestamp', new Date().toISOString());

        // Send image message to the backend
        this.http.post('http://localhost:3000/upload-image', formData).subscribe(() => {
          this.selectedFile = null; // Clear the file after upload
        });
      } else {
        // Send text message
        const messageData = {
          group: this.group.name,
          channel: this.channel,
          sender: this.loggedInUser,
          message: this.newMessage,
          timestamp: new Date()
        };

        this.socket.emit('message', messageData); // Emit text message to the server
      }

      this.newMessage = ''; // Clear input after sending
    }
  }

  // Go back to the list of channels
  onBackToChannels(): void {
    const navigationExtras: NavigationExtras = {
      state: { group: this.group }
    };
    this.router.navigate(['channels'], navigationExtras);
  }

  // Disconnect from the socket when the component is destroyed
  ngOnDestroy(): void {
    this.socket.disconnect(); // Clean up the socket connection
  }

  // Helper to get profile picture URL
  getProfilePictureUrl(picturePath: string): string {
    return `http://localhost:3000/${picturePath}`;
  }

  // Start video chat by navigating to the video chat component
  startVideoChat(): void {
    const navigationExtras: NavigationExtras = {
      state: { group: this.group, channel: this.channel }
    };
    this.router.navigate(['/video-chat'], navigationExtras); // Navigate to video chat
  }
}
