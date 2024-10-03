import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationExtras } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.css'
})
export class ChannelsComponent implements OnInit {
  channels: string[] = [];  // This will hold the channels
  group: any = {};  // This will hold the group object
  loggedInUser: string = ''; // Store the logged-in user's username
  isGroupAdmin: boolean = false; // Check if the logged-in user is a group admin

  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    // Attempt to get the group from the navigation state or URL
    this.route.paramMap.subscribe(params => {
      const group = window.history.state.group;  // Group passed via state
      if (group) {
        this.group = group;
        this.channels = group.channels || []; // Initialize channels array
        this.loadUserSession();
      } else {
        // If no group in state, fetch it using groupName from URL
        const groupName = this.route.snapshot.paramMap.get('groupName'); // Assuming groupName is passed in URL
        this.fetchGroupDetails(groupName);
      }
    });
  }

  // Fetch group details if not passed in state (this is optional)
  fetchGroupDetails(groupName: string | null) {
    if (groupName) {
      this.http.get<any>(`http://localhost:3000/groups/${groupName}`).subscribe({
        next: (groupData) => {
          this.group = groupData;
          this.channels = groupData.channels || [];
          this.loadUserSession();
        },
        error: (error) => {
          console.error('Error fetching group details:', error);
        }
      });
    }
  }

  // Load logged-in user's session to check group admin status
  loadUserSession() {
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.loggedInUser = userData.username;
        this.isGroupAdmin = this.group.groupAdmins?.includes(this.loggedInUser); // Check if user is a group admin
      },
      error: (error) => {
        console.error('Error loading user session:', error);
      }
    });
  }

  // Function to navigate to the chat when a channel is clicked
  onChannelClick(channel: string) {
    const navigationExtras: NavigationExtras = {
      state: {
        group: this.group,
        channel: channel
      }
    };
    this.router.navigate(['chat'], navigationExtras);
  }

  // Function to navigate to the create new channel page
  onClickCreateNewChannel() {
    const navigationExtras: NavigationExtras = {
      state: {
        group: this.group // Pass the full group object
      }
    };
    this.router.navigate(['create-new-channel'], navigationExtras);
  }

  // Function to delete a channel (only visible to group admins)
  onDeleteChannel(channel: string) {
    if (confirm(`Are you sure you want to delete the channel "${channel}"?`)) {
      this.http.delete(`http://localhost:3000/groups/${this.group.name}/channels/${channel}`).subscribe({
        next: (response) => {
          console.log(`Channel "${channel}" deleted successfully.`);
          // Remove the deleted channel from the channels list
          this.channels = this.channels.filter(ch => ch !== channel);
        },
        error: (error) => {
          console.error('Error deleting channel:', error);
        }
      });
    }
  }

  // Navigate back to groups page
  onBackToGroups() {
    this.router.navigate(['groups']);
  }
}
