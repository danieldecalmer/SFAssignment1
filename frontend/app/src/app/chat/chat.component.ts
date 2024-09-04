import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  group: any = {};
  channel: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const group = window.history.state.group;
      const channel = window.history.state.channel;
      if (group && channel) {
        this.group = group;
        this.channel = channel;
      }
    });
  }

  onBackToChannels() {
    const navigationExtras: NavigationExtras = {
      state: { group: this.group }
    };
    this.router.navigate(['channels'], navigationExtras);
  }
}
