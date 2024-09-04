import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-new-account',
  standalone: true,
  imports: [ RouterModule ],
  templateUrl: './create-new-account.component.html',
  styleUrl: './create-new-account.component.css'
})
export class CreateNewAccountComponent {

  constructor(private router: Router) { }

  OnCreateAccount () {
    this.router.navigate(['login']);
  }
}
