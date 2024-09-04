import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.css'
})

export class MemberListComponent implements OnInit {
  members: any[] = [];
  groupName: string = '';
  groupAdmin: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const group = window.history.state.group;
      if (group) {
        this.groupName = group.name;
        this.members = group.members;
        this.groupAdmin = group.groupAdmin;
      }
    });
  }

  onKickMember(member: string) {
    // Implement kicking logic
  }

  onPromoteMember(member: string) {
    // Implement promote logic
  }
}
