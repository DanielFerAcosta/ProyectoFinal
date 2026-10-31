import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home.component').then(
        (component) => component.HomeComponent,
      ),
    title: 'Entrena | Entrenamiento y bienestar',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (component) => component.LoginComponent,
      ),
    title: 'Iniciar sesión | Entrena',
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (component) => component.RegisterComponent,
      ),
    title: 'Crear cuenta | Entrena',
  },
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (component) => component.DashboardComponent,
      ),
    title: 'Mi panel | Entrena',
  },
  {
    path: 'ejercicios',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(
        (component) => component.CatalogComponent,
      ),
    title: 'Catálogo de ejercicios | Entrena',
  },
  {
    path: 'rutinas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/routines/routines.component').then(
        (component) => component.RoutinesComponent,
      ),
    title: 'Mis rutinas | Entrena',
  },
  {
    path: '**',
    redirectTo: '',
  },
];