import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CreateNewAccountComponent } from './create-new-account/create-new-account.component';
import { GroupsComponent } from './groups/groups.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' }, 
    { path: 'login', component: LoginComponent },
    { path: 'create-new-account', component: CreateNewAccountComponent },
    { path: 'groups', component: GroupsComponent }
];
