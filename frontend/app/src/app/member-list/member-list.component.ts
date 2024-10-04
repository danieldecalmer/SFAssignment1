import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.css'] // Changed to 'styleUrls' for consistency
})
export class MemberListComponent implements OnInit {
  members: any[] = [];
  groupName: string = '';
  groupAdmin: string = '';
  waitingList: any[] = [];
  loggedInUser: string = '';
  isGroupAdmin: boolean = false;
  isSuperAdmin: boolean = false;
  otherUsers: any[] = []; // List of users that can be added to the group

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      const group = window.history.state.group;
      if (group) {
        this.groupName = group.name;
        this.members = group.members;
        this.groupAdmin = group.groupAdmin;
        this.loadUserSession();
      }
    });
  }

  // Load the current user session
  loadUserSession() {
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.loggedInUser = userData.username;
        this.isSuperAdmin = userData.roles.includes('super');
        this.isGroupAdmin = this.isSuperAdmin || this.loggedInUser === this.groupAdmin;
        this.loadWaitingList();
        this.loadOtherUsers();
      },
      error: (error) => {
        console.error('Error loading user session:', error);
      }
    });
  }

  // Load the group's waiting list
  loadWaitingList() {
    this.http.get<any>(`http://localhost:3000/groups/${this.groupName}/waiting-list`).subscribe({
      next: (waitingData) => {
        this.waitingList = waitingData;
      },
      error: (error) => {
        console.error('Error loading waiting list:', error);
      }
    });
  }

  // Load users who are not part of the group
  loadOtherUsers() {
    this.http.get<any[]>('http://localhost:3000/users', { withCredentials: true }).subscribe({
      next: (allUsers: any[]) => {
        this.otherUsers = allUsers.filter((user: { username: string }) => !this.members.includes(user.username));
      },
      error: (error) => {
        console.error('Error loading other users:', error);
      }
    });
  }

  // Kick a member from the group
  onKickMember(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/kick`, { member }).subscribe({
        next: (response) => {
          console.log(response);
          // Remove the kicked member from the members list
          this.members = this.members.filter(m => m !== member);
        },
        error: (error) => {
          console.error('Error kicking member:', error);
        }
      });
    }
  }

  // Promote a member to group admin
  onPromoteMember(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/promote`, { member }).subscribe({
        next: (response) => {
          console.log(response);
        },
        error: (error) => {
          console.error('Error promoting member:', error);
        }
      });
    }
  }

  // Add a member from the waiting list to the group
  onAddWaitingListMember(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/add-member`, { member }).subscribe({
        next: (response) => {
          console.log(response);
          // Add the member to the group and remove them from the waiting list
          this.members.push(member);
          this.waitingList = this.waitingList.filter(m => m !== member);
        },
        error: (error) => {
          console.error('Error adding member:', error);
        }
      });
    }
  }

  // Add a user from the "Other Users" list to the group
  onAddOtherUser(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/add-member`, { member }).subscribe({
        next: (response) => {
          console.log(response);
          // Add the user to the members list and remove from the "Other Users" list
          this.members.push(member);
          this.otherUsers = this.otherUsers.filter(user => user.username !== member);
        },
        error: (error) => {
          console.error('Error adding user to group:', error);
        }
      });
    }
  }

  // Navigate to the "Ban and Report" page for a specific member
  onBanAndReport(member: string) {
    const navigationExtras: NavigationExtras = {
      state: { username: member }
    };
    this.router.navigate(['ban-and-report'], navigationExtras);
  }

  // Remove the logged-in user from the group
  onLeaveGroup() {
    if (!this.isSuperAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/leave`, { username: this.loggedInUser }).subscribe({
        next: (response) => {
          console.log(response);
          this.router.navigate(['groups']);
        },
        error: (error) => {
          console.error('Error leaving group:', error);
        }
      });
    }
  }

  // Navigate back to the groups list
  onBackToGroups() {
    this.router.navigate(['groups']);
  }
}
