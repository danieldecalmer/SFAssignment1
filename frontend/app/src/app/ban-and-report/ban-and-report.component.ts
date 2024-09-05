import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ban-and-report',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ban-and-report.component.html',
  styleUrl: './ban-and-report.component.css'
})
export class BanAndReportComponent implements OnInit {
  username: string = '';
  report: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Get the state passed via window.history.state
    const state = window.history.state;
    if (state && state.username) {
      this.username = state.username;
    } else {
      console.error('No username found in state');
      this.router.navigate(['member-list']); // Redirect to member list if no username is found
    }
  }

  onSubmitBan(): void {
    const payload = {
      username: this.username,
      report: this.report
    };

    this.http.post('http://localhost:3000/ban-user', payload).subscribe({
      next: (response) => {
        console.log(response);
        // Navigate back to the member list after banning the user
        this.router.navigate(['groups']);
      },
      error: (error) => {
        console.error('Error banning user:', error);
      }
    });
  }
}
