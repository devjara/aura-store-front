import { Route } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { LayoutComponent } from './layouts/layout.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, title: 'Aura Market | Inicio' },
      { path: 'catalogo', component: CatalogComponent, title: 'Aura Market | Catálogo' },
    ]
  }


];
