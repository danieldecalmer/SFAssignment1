import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.css'
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

  loadUserSession() {
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.loggedInUser = userData.username;
        this.isSuperAdmin = userData.roles.includes('super');
        this.isGroupAdmin = this.isSuperAdmin || this.loggedInUser === this.groupAdmin;
        this.loadWaitingList();
        this.loadOtherUsers(); // Load the "Other Users" who are not in the group
      },
      error: (error) => {
        console.error('Error loading user session:', error);
      }
    });
  }

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

  // Fetch all users and filter those who are not in the group
  loadOtherUsers() {
    this.http.get<any[]>('http://localhost:3000/users', { withCredentials: true }).subscribe({
      next: (allUsers: any[]) => {
        // Filter out members who are already in the group
        this.otherUsers = allUsers.filter((user: { username: string }) => !this.members.includes(user.username));
      },
      error: (error) => {
        console.error('Error loading other users:', error);
      }
    });
  }


  // Kick member (group admin only)
  onKickMember(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/kick`, { member }).subscribe({
        next: (response) => {
          console.log(response);
          this.members = this.members.filter(m => m !== member);
        },
        error: (error) => {
          console.error('Error kicking member:', error);
        }
      });
    }
  }

  // Promote member to group admin (group admin only)
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

  // Add a user from the waiting list to the group
  onAddWaitingListMember(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/add-member`, { member }).subscribe({
        next: (response) => {
          console.log(response);
          this.members.push(member);
          this.waitingList = this.waitingList.filter(m => m !== member);
        },
        error: (error) => {
          console.error('Error adding member:', error);
        }
      });
    }
  }

  // Add a user from the "Other Users" section to the group
  onAddOtherUser(member: string) {
    if (this.isGroupAdmin) {
      this.http.post(`http://localhost:3000/groups/${this.groupName}/add-member`, { member }).subscribe({
        next: (response) => {
          console.log(response);
          
          // Add to group members list
          this.members.push(member);
          
          // Remove from the otherUsers list immediately
          this.otherUsers = this.otherUsers.filter(m => m.username !== member);
          
          // Optionally trigger change detection (if necessary)
          // this.changeDetectorRef.detectChanges(); // Uncomment if you use ChangeDetectorRef
        },
        error: (error) => {
          console.error('Error adding member:', error);
        }
      });
    }
  }


  // Navigate to Ban and Report with the username
  onBanAndReport(member: string) {
    const navigationExtras: NavigationExtras = {
      state: { username: member }
    };
    this.router.navigate(['ban-and-report'], navigationExtras);
  }

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

  onBackToGroups() {
    this.router.navigate(['groups']);
  }
}
