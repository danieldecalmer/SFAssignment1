import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  OnCreateNewAccount() {
    this.router.navigate(['create-new-account']);
  }

  OnLogin() {
    // Make a POST request to the /login route
    this.http.post<{ message: string, user: { id: string, username: string, roles: string[], groups: string[] } }>(
        'http://localhost:3000/login', 
        { username: this.username, password: this.password }, 
        { withCredentials: true }) // Include credentials (cookies) for session management
      .subscribe({
        next: (response) => {
          // Check if the login was successful by inspecting the message
          if (response.message.includes('logged in successfully')) {
            // Log the success message
            console.log(response.message);
  
            // You can also access the user data from response.user if needed
            console.log('Logged in user details:', response.user);
  
            // Navigate to the groups page after successful login
            this.router.navigate(['groups']);
          } else {
            // Handle a failed login attempt
            this.errorMessage = 'Login failed, please check your credentials.';
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = 'An error occurred during login. Please try again later.';
        }
      });
  }
  
}