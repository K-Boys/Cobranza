import { Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ClientListComponent } from './clients.component';
import { ClientDetailComponent } from './client-detail.component';
import { SuppliesComponent } from './supplies.component';
import { ReportsComponent } from './reports.component';
import { FinancialComponent } from './financial.component';
import { DelaysComponent } from './delays.component';
import { RoutesComponent } from './routes.component';
import { LoginComponent } from './login.component';
import { UsersComponent } from './users.component';
import { authGuard, permissionGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'clients', pathMatch: 'full' },
      { path: 'clients', component: ClientListComponent, canActivate: [permissionGuard('clients')] },
      { path: 'clients/:id', component: ClientDetailComponent, canActivate: [permissionGuard('clients')] },
      { path: 'supplies', component: SuppliesComponent, canActivate: [permissionGuard('supplies')] },
      { path: 'routes', component: RoutesComponent, canActivate: [permissionGuard('routes')] },
      { path: 'financial', component: FinancialComponent, canActivate: [permissionGuard('financial')] },
      { path: 'reports', component: ReportsComponent, canActivate: [permissionGuard('reports')] },
      { path: 'delays', component: DelaysComponent, canActivate: [permissionGuard('delays')] },
      { path: 'users', component: UsersComponent, canActivate: [permissionGuard('users')] }
    ]
  }
];

