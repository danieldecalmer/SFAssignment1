import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.css'
})
export class ChannelsComponent {
  channels: string[] = [];  // This will hold the channels

  constructor(private router: Router) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const group = navigation.extras.state['group'];
      if (group && group.channels) {
        this.channels = group.channels;
      }
    }
  }

  onClickCreateNewChannel() {
    // Add logic to handle creating a new channel
  }
}
