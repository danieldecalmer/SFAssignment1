import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ban-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ban-list.component.html',
  styleUrls: ['./ban-list.component.css']
})
export class BanListComponent implements OnInit {
  bannedUsers: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBannedUsers();
  }

  loadBannedUsers(): void {
    this.http.get<any[]>('http://localhost:3000/banned-users').subscribe({
      next: (bannedData) => {
        this.bannedUsers = bannedData;
      },
      error: (error) => {
        console.error('Error loading banned users:', error);
      }
    });
  }

  unbanUser(username: string): void {
    this.http.post('http://localhost:3000/unban-user', { username }).subscribe({
      next: (response: any) => {
        console.log(response.message);
        // Remove the user from the bannedUsers list in the UI
        this.bannedUsers = this.bannedUsers.filter(user => user.username !== username);
      },
      error: (error) => {
        console.error('Error unbanning user:', error);
      }
    });
  }
}
