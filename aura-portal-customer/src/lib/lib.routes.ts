import { Route } from '@angular/router';
import { authGuard } from 'core';

import { PortalLayoutComponent } from './layout/portal-layout/portal-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { OrderHistoryComponent } from './pages/order-history/order-history.component';
import { AddressBookComponent } from './pages/address-book/address-book.component';
import { AccountSettingsComponent } from './pages/account-settings/account-settings.component';

export const auraPortalCustomerRoutes: Route[] = [
  {
    path: '',
    // La raíz de TODO el portal está protegida por el Guard
    canActivate: [authGuard],
    // El cascarón estático del portal (Sidebar)
    component: PortalLayoutComponent,
    // Las páginas internas dinámicas que cambian según la URL
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'orders', component: OrderHistoryComponent },
      { path: 'addresses', component: AddressBookComponent },
      { path: 'settings', component: AccountSettingsComponent },
    ],
  },
];
