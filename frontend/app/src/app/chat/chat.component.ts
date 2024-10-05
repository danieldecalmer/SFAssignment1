import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationExtras } from '@angular/router';
import { io, Socket } from 'socket.io-client'; // Import Socket.io
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  group: any = {};
  channel: string = '';
  socket: Socket; // Socket instance
  messages: any[] = []; // To store chat messages
  newMessage: string = ''; // Model for the new message input

  constructor(private route: ActivatedRoute, private router: Router) {
    this.socket = io('http://localhost:3000'); // Connect to the server
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      const group = window.history.state.group;
      const channel = window.history.state.channel;
      if (group && channel) {
        this.group = group;
        this.channel = channel;

        // Join the group-channel room
        this.socket.emit('joinChannel', { group: this.group.name, channel: this.channel });

        // Listen for chat history and new messages
        this.socket.on('chatHistory', (history: any[]) => {
          this.messages = history; // Load chat history
        });

        this.socket.on('newMessage', (message: any) => {
          this.messages.push(message); // Append new message to chat
        });
      }
    });
  }

  // Handle sending messages
  sendMessage() {
    if (this.newMessage.trim()) {
      this.socket.emit('sendMessage', {
        group: this.group.name,
        channel: this.channel,
        message: this.newMessage
      });
      this.newMessage = ''; // Clear input after sending
    }
  }

  onBackToChannels() {
    const navigationExtras: NavigationExtras = {
      state: { group: this.group }
    };
    this.router.navigate(['channels'], navigationExtras);
  }

  ngOnDestroy(): void {
    this.socket.disconnect(); // Disconnect from the socket when the component is destroyed
  }
}
