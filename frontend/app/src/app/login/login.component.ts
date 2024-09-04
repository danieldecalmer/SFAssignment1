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
    this.http.post('http://localhost:3000/login', { username: this.username, password: this.password }, { responseType: 'text' })
      .subscribe({
        next: (response) => {
          if (response.includes('success')) {
            this.router.navigate(['groups']);
          } else {
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
