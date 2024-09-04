import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-new-account',
  standalone: true,
  imports: [ RouterModule, CommonModule,  FormsModule ],
  templateUrl: './create-new-account.component.html',
  styleUrl: './create-new-account.component.css'
})
export class CreateNewAccountComponent {
  email: string = '';
  username: string = '';
  password: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  OnCreateAccount() {
    // Prevent default form submission
    event?.preventDefault();
    
    this.http.post('http://localhost:3000/register', {
      email: this.email,
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('Account created successfully:', response);
        this.router.navigate(['login']);
      },
      error: (error) => {
        console.error('Error creating account:', error);
      }
    });
  }
}
