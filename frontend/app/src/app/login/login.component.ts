import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router) { }

  OnCreateNewAccount() {
    this.router.navigate(['create-new-account']);
  }

  onLogin() {
    if (this.username === 'super' && this.password === '123') {
      this.router.navigate(['groups']);
    } else {
      this.errorMessage = 'Invalid username or password!';
    }
  }
}
