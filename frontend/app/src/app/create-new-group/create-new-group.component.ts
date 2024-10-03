import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-new-group',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-new-group.component.html',
  styleUrl: './create-new-group.component.css'
})
export class CreateNewGroupComponent implements OnInit {
  groupName: string = '';
  loggedInUser: string = ''; // To store the logged-in user's username

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    // Load the user session to get the logged-in user's username
    this.http.get<any>('http://localhost:3000/user-session', { withCredentials: true }).subscribe({
      next: (userData) => {
        this.loggedInUser = userData.username;
      },
      error: (error) => {
        console.error('Error loading user session:', error);
      }
    });
  }

  onSubmit(): void {
    const newGroup = {
      name: this.groupName,
      channels: [],
      members: [this.loggedInUser], // Set the logged-in user as the first member
      groupAdmin: this.loggedInUser // Set the logged-in user as the group admin
    };

    this.http.post('http://localhost:3000/groups', newGroup).subscribe({
      next: (response) => {
        console.log('Group created successfully:', response);
        // Navigate back to the groups page after successful creation
        this.router.navigate(['groups'], { state: { reload: true } }); // Add state to trigger reload
      },
      error: (error) => {
        console.error('Error creating group:', error);
      }
    });
  }

  onBackToGroups(): void {
    this.router.navigate(['groups']); // Navigate back to groups page
  }
}
