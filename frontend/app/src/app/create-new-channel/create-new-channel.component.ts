import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-new-channel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-new-channel.component.html',
  styleUrl: './create-new-channel.component.css'
})
export class CreateNewChannelComponent implements OnInit {
  channelName: string = '';
  group: any = {}; // Full group object
  channels: string[] = []; // Channels list from the group

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Attempt to retrieve state from window.history
    const group = window.history.state.group;
    
    console.log('Retrieved group from window.history.state:', group); // Logging for debugging

    if (group && group.channels) {
      this.channels = group.channels;
      this.group = group;
      console.log('Channels and group set successfully:', this.channels, this.group); // Logging for debugging
    } else {
      console.error('Group object is not provided or does not contain channels!');
      this.router.navigate(['groups']); // Redirect to groups page if no group data is found
    }
  }

  onSubmit(): void {
    if (!this.group.name) {
      console.error('Group name is required to create a channel');
      return;
    }

    const newChannel = {
      name: this.channelName
    };

    this.http.post(`http://localhost:3000/groups/${this.group.name}/channels`, { channel: this.channelName })
      .subscribe({
        next: (response) => {
          console.log('Channel created successfully:', response);

          // Update the group's channels list with the new channel
          this.group.channels.push(this.channelName);

          // Navigate back to the channels component with the updated group object
          this.router.navigate(['channels'], { state: { group: this.group } });
        },
        error: (error) => {
          console.error('Error creating channel:', error);
        }
      });
  }

  onBackToChannels(): void {
    this.router.navigate(['channels'], { state: { group: this.group } }); // Navigate back to channels
  }
}