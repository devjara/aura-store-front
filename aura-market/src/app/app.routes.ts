import { Route } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { LayoutComponent } from './layouts/layout.component';
import { WomanComponent } from './pages/woman/woman.component';
import { MenComponent } from './pages/men/men.component';
import { AuthComponent } from './pages/auth/auth.component';


export const appRoutes: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, title: 'Aura Market | Inicio' },
      { path: 'woman', component: WomanComponent, title: 'Aura Market | Mujer' },
      { path: 'men', component: MenComponent, title: 'Aura Market | Hombre'},
      { path: 'catalogo', component: CatalogComponent, title: 'Aura Market | Catálogo' },
      { path: 'auth', component: AuthComponent, title: 'Aura Market | Autenticación' },
    ]
  }
];
