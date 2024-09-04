import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationExtras } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent {
  constructor(private router: Router) {}

  groups = [
    { name: 'Group 1', channels: ['Channel A', 'Channel B', 'Channel C', 'Channel D'], members: ['Josh', 'Steve', 'John', 'Rob', 'Lester', 'Moe'], groupAdmin: 'Josh' },
    { name: 'Group 2', channels: ['Channel E', 'Channel F'], members: ['Emily', 'Anna'], groupAdmin: 'Emily' },
    { name: 'Group 3', channels: ['Channel G', 'Channel H', 'Channel I'], members: ['Bob', 'Kevin', 'Stuart'], groupAdmin: 'Kevin' },
    { name: 'Group 4', channels: ['Channel J', 'Channel K', 'Channel L', 'Channel M'], members: ['Sarah', 'Alex'], groupAdmin: 'Sarah' },
    { name: 'Group 5', channels: ['Channel N', 'Channel O', 'Channel P', 'Channel Q'], members: ['Emma', 'Olivia', 'Ava'], groupAdmin: 'Emma' },
    { name: 'Group 6', channels: ['Channel R', 'Channel S', 'Channel T'], members: ['Grace', 'Chloe', 'Zoe'], groupAdmin: 'Chloe' },
    { name: 'Group 7', channels: ['Channel U', 'Channel V'], members: ['Hannah', 'Lily'], groupAdmin: 'Hannah' }
  ];

  onClickGroup(group: any) {
    // Using Navigation Extras to pass state
    const navigationExtras: NavigationExtras = {
      state: { group: group }
    };
    this.router.navigate(['channels'], navigationExtras);
  }

  onClickMember(group: any) {
    // Assuming you want to navigate to a page that lists members
    // This will need to pass either the group object or a specific identifier
    this.router.navigate(['member-list'], { state: { members: group.members, groupName: group.name } });
  }

  createNewGroup () {

  }


}
