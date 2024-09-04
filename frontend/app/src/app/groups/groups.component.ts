import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationExtras } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})

export class GroupsComponent implements OnInit {
  groups: any[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.http.get<any[]>('http://localhost:3000/groups').subscribe({
      next: (data) => {
        this.groups = data;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  onClickGroup(group: any) {
    const navigationExtras: NavigationExtras = {
      state: { group: group }
    };
    this.router.navigate(['channels'], navigationExtras);
  }

  onClickMember(group: any) {
    const navigationExtras: NavigationExtras = {
      state: { group: group }
    };
    this.router.navigate(['member-list'], navigationExtras);
  }

  createNewGroup() {
    this.router.navigate(['create-new-group']);
  }
}