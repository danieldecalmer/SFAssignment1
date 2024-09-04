import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.css'
})
export class ChannelsComponent implements OnInit {
  channels: string[] = [];  // This will hold the channels
  group: any = {};  // This will hold the group object

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Attempt to retrieve state from ActivatedRoute
    this.route.paramMap.subscribe(params => {
      const group = window.history.state.group;
      if (group && group.channels) {
        this.channels = group.channels;
      }
    });
  }

  onChannelClick(channel: string) {
    const navigationExtras: NavigationExtras = {
      state: {
        channel: channel 
      }
    };
    this.router.navigate(['chat'], navigationExtras);
  }

  onClickCreateNewChannel () {
    this.router.navigate(['create-new-channel']);
  }
}
