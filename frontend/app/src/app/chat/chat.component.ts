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

        // Client-side: Emitting group and channel correctly
        this.socket.emit('joinChannel', { group: this.group.name, channel: this.channel });

        // Listen for chat history
        this.socket.on('chat-history', (history: any[]) => {
          this.messages = history; // Load chat history
        });

        // Listen for new messages
        this.socket.on('new-message', (message: any) => {
          this.messages.push(message); // Append new message to chat
        });
      }
    });
  }

  // Proper implementation to load user session data from the backend
  loadUserSession() {
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.loggedInUser = userData.username; // Set the logged-in user's username
        console.log('User session loaded:', userData);
      },
      error: (error) => {
        console.error('Error loading user session:', error);
        // Optionally, you can redirect to login if user is not logged in
        this.router.navigate(['/login']);
      }
    });
  }

  // Handle sending messages
  sendMessage() {
    if (this.newMessage.trim()) {
      const messageData = {
        group: this.group.name,
        channel: this.channel,
        sender: this.loggedInUser,
        message: this.newMessage,
        timestamp: new Date()
      };

      // Emit 'message' event to the server with the message data
      this.socket.emit('message', messageData);
      this.newMessage = ''; // Clear input after sending
    }
  }

  // Go back to the list of channels
  onBackToChannels() {
    const navigationExtras: NavigationExtras = {
      state: { group: this.group }
    };
    this.router.navigate(['channels'], navigationExtras);
  }

  // Disconnect from the socket when the component is destroyed
  ngOnDestroy(): void {
    this.socket.disconnect(); // Clean up the socket connection
  }
}
