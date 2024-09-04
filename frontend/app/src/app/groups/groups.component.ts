import { Component } from '@angular/core';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent {

  groups = [
    { name: 'Group 1', channels: ['Channel A', 'Channel B', 'Channel C', 'Channel D'], members: ['Josh', 'Steve', 'John', 'Rob', 'Lester', 'Moe'], groupAdmin: 'Josh' },
    { name: 'Group 2', channels: ['Channel E', 'Channel F'], members: ['Emily', 'Anna'], groupAdmin: 'Emily' },
    { name: 'Group 3', channels: ['Channel G', 'Channel H', 'Channel I'], members: ['Bob', 'Kevin', 'Stuart'], groupAdmin: 'Kevin' }
  ];
}
