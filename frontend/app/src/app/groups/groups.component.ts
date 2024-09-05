import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  userGroups: any[] = []; 
  otherGroups: any[] = [];
  allGroups: any[] = [];
  user: any = {};
  canCreateGroup: boolean = false;
  feedbackMessage: string = '';
  isSuperAdmin: boolean = false; // Add a flag to check if the user is a super admin

  constructor(private router: Router, private http: HttpClient) {}
  
  ngOnInit(): void {
    this.loadUserAndGroups();
  }

  loadUserAndGroups() {
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.user = userData;
        this.isSuperAdmin = this.user.roles.includes('super'); // Check if the user is a super admin
        this.checkUserPermissions();
        this.loadGroups();
      },
      error: (error) => {
        console.error('Error loading user session:', error);
      }
    });
  }

  loadGroups() {
    this.http.get<any[]>('http://localhost:3000/groups').subscribe({
      next: (groupsData) => {
        this.allGroups = groupsData;
        this.splitGroups();
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }
  
  checkUserPermissions() {
    if (this.user.roles && (this.user.roles.includes('group') || this.user.roles.includes('super'))) {
      this.canCreateGroup = true;
    }
  }

  splitGroups() {
    this.userGroups = this.allGroups.filter(group => group.members.includes(this.user.username));
    this.otherGroups = this.allGroups.filter(group => !group.members.includes(this.user.username));
  }

  onClickGroup(group: any) {
    if (this.user.groups.includes(group.name)) {
      const navigationExtras: NavigationExtras = {
        state: { group: group }
      };
      this.router.navigate(['channels'], navigationExtras);
    }
  }

  registerInterest(group: any) {
    const payload = { username: this.user.username };

    this.http.post(`http://localhost:3000/groups/${group.name}/register-interest`, payload).subscribe({
      next: (response: any) => {
        this.feedbackMessage = response.message;
      },
      error: (error) => {
        this.feedbackMessage = 'Error registering interest: ' + error.error.message;
      }
    });
  }

  onClickMember(group: any) {
    const navigationExtras: NavigationExtras = {
      state: { group: group }
    };
    this.router.navigate(['member-list'], navigationExtras);
  }

  createNewGroup() {
    if (this.canCreateGroup) {
      this.router.navigate(['create-new-group']);
    }
  }

  // Navigate to the ban list (only for super admins)
  viewBanList() {
    this.router.navigate(['ban-list']);
  }

  // Logout method to call /logout and navigate to /login
  onLogout() {
    this.http.post('http://localhost:3000/logout', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error logging out:', error);
      }
    });
  }

  // Check if the current user can delete this group (super admin or group admin)
  canDeleteGroup(group: any) {
    return this.user.roles.includes('super') || group.groupAdmins.includes(this.user.username);
  }

  // Delete group method
  deleteGroup(group: any) {
    const payload = { username: this.user.username };

    this.http.delete(`http://localhost:3000/groups/${group.name}`, { body: payload, withCredentials: true }).subscribe({
      next: (response: any) => {
        console.log(response.message);
        this.loadGroups(); // Refresh the groups after deletion
      },
      error: (error) => {
        console.error('Error deleting group:', error);
      }
    });
  }

  // Check if the user has an empty roles array
  canDeleteAccount() {
    return this.user.roles?.length === 0 ? true : false;
  }

  // Delete account method
  deleteAccount() {
    this.http.delete('http://localhost:3000/delete-account', { withCredentials: true }).subscribe({
      next: (response: any) => {
        console.log(response.message);
        this.router.navigate(['/login']); // Navigate to login after account deletion
      },
      error: (error) => {
        console.error('Error deleting account:', error);
      }
    });
  }
}
