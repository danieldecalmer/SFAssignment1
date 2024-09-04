import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-new-channel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-new-channel.component.html',
  styleUrl: './create-new-channel.component.css'
})
export class CreateNewChannelComponent {
  channelName: string = '';

  onSubmit(formValues: any): void {
    console.log('Form Submitted', formValues);
    // Here you would add logic to communicate with the backend to save the channel
  }
}
