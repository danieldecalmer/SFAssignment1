import { Component } from '@angular/core';
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
export class CreateNewGroupComponent {
  groupName: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  onSubmit(formValues: any): void {
    const newGroup = {
      name: this.groupName,
      channels: [],
      members: [],
      groupAdmin: ''
    };

    this.http.post('http://localhost:3000/groups', newGroup).subscribe({
      next: (response) => {
        console.log('Group created successfully:', response);
        this.router.navigate(['groups']);
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
