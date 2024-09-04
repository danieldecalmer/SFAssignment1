import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-new-group',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-new-group.component.html',
  styleUrl: './create-new-group.component.css'
})
export class CreateNewGroupComponent {
  groupName: string = '';

  constructor(private router: Router) {}

  onSubmit(formValues: any): void {
    console.log('Form Submitted', formValues);
    this.router.navigate(['groups']);
    // Here you would add logic to communicate with the backend to save the group
  }
}
