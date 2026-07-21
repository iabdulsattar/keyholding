import { Routes, PreloadAllModules } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
      {
        path:'',
        loadComponent: () => import('./layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
        canActivate: [authGuard],
        children:[
          {
            path: '',
            loadComponent: () => import('./dashboard/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
            pathMatch: 'full',
            title:
              'Dashboard | eDOB',
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./dashboard/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
            title: 'Dashboard | eDOB'
          },
          {
            path: 'dob-feed',
            redirectTo: 'entries',
            pathMatch: 'full'
          },
          {
            path: 'entries',
            loadComponent: () => import('./dob-feed/entries.component').then(m => m.EntriesComponent),
            canActivate: [authGuard, permissionGuard('entry.view')],
            title: 'Entries | eDOB'
          },
          {
            path: 'entries/:id',
            loadComponent: () => import('./dob-feed/entry-detail/entry-detail.component').then(m => m.EntryDetailComponent),
            canActivate: [authGuard, permissionGuard('entry.view')],
            title: 'Entry Detail | eDOB'
          },
          {
            path: 'create-entry',
            loadComponent: () => import('./dob-feed/create-entry/create-entry.component').then(m => m.CreateEntryComponent),
            canActivate: [authGuard, permissionGuard('entry.create')],
            title: 'Create Entry | eDOB'
          },
          {
            path:'calendar',
            loadComponent: () => import('./dashboard/pages/calender/calender.component').then(m => m.CalenderComponent),
            title:'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'profile',
            loadComponent: () => import('./dashboard/pages/profile/profile.component').then(m => m.ProfileComponent),
            title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'form-elements',
            loadComponent: () => import('./features/pages/forms/form-elements/form-elements.component').then(m => m.FormElementsComponent),
            title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'basic-tables',
            loadComponent: () => import('./features/pages/tables/basic-tables/basic-tables.component').then(m => m.BasicTablesComponent),
            title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'blank',
            loadComponent: () => import('./features/pages/blank/blank.component').then(m => m.BlankComponent),
            title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path: 'invoice',
            loadComponent: () => import('./features/pages/invoices/invoices.component').then(m => m.InvoicesComponent),
            title: 'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path: 'clients',
            loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent),
            title: 'Clients | KeyVault Pro'
          },
          {
            path: 'clients/:id',
            loadComponent: () => import('./clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent),
            title: 'Client Details | KeyVault Pro'
          },
          {
            path: 'keys/add-key',
            loadComponent: () => import('./keys/add-key/add-key.component').then(m => m.AddKeyComponent),
            title: 'Add New Key | KeyVault Pro'
          },
          {
            path: 'keys/view-key',
            loadComponent: () => import('./keys/view-key/view-key.component').then(m => m.ViewKeyComponent),
            title: 'View Key Details | KeyVault Pro'
          },
          {
            path: 'sites/add-site',
            loadComponent: () => import('./sites/add-site/add-site.component').then(m => m.AddSiteComponent),
            title: 'Add New Site | KeyVault Pro'
          },
          {
            path: 'sites/view-site',
            loadComponent: () => import('./sites/view-site/view-site.component').then(m => m.ViewSiteComponent),
            title: 'Site Details | KeyVault Pro'
          },
          {
            path: 'user-management',
            loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent),
            canActivate: [authGuard, permissionGuard('admin.users.manage')],
            title: 'User Management | eDOB'
          },
          {
            path: 'users/add-user',
            loadComponent: () => import('./users/add-user/add-user.component').then(m => m.AddUserComponent),
            canActivate: [authGuard, permissionGuard('admin.users.manage')],
            title: 'Add User | eDOB'
          },
          {
            path: 'roles/add-role',
            loadComponent: () => import('./roles/add-role/add-role.component').then(m => m.AddRoleComponent),
            canActivate: [authGuard, permissionGuard('admin.roles.manage')],
            title: 'Add Role | eDOB'
          },
          {
            path: 'roles/view-role',
            loadComponent: () => import('./roles/view-role/view-role.component').then(m => m.ViewRoleComponent),
            canActivate: [authGuard, permissionGuard('role.view')],
            title: 'View Role | eDOB'
          },
          {
            path: 'roles/deactivate-role',
            loadComponent: () => import('./roles/deactivate-role/deactivate-role.component').then(m => m.DeactivateRoleComponent),
            canActivate: [authGuard, permissionGuard('role.deactivate')],
            title: 'Deactivate Role | eDOB'
          },
          {
            path: 'roles/reactivate-role',
            loadComponent: () => import('./roles/reactivate-role/reactivate-role.component').then(m => m.ReactivateRoleComponent),
            canActivate: [authGuard, permissionGuard('role.reactivate')],
            title: 'Reactivate Role | eDOB'
          },
          {
            path: 'roles/delete-role',
            loadComponent: () => import('./roles/delete-role/delete-role.component').then(m => m.DeleteRoleComponent),
            canActivate: [authGuard, permissionGuard('role.delete')],
            title: 'Delete Role | eDOB'
          },
          {
            path:'line-chart',
            loadComponent: () => import('./features/pages/charts/line-chart/line-chart.component').then(m => m.LineChartComponent),
            title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'bar-chart',
            loadComponent: () => import('./features/pages/charts/bar-chart/bar-chart.component').then(m => m.BarChartComponent),
            title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'alerts',
            loadComponent: () => import('./ui-elements/pages/alerts/alerts.component').then(m => m.AlertsComponent),
            title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'avatars',
            loadComponent: () => import('./ui-elements/pages/avatar-element/avatar-element.component').then(m => m.AvatarElementComponent),
            title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'badge',
            loadComponent: () => import('./ui-elements/pages/badges/badges.component').then(m => m.BadgesComponent),
            title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'buttons',
            loadComponent: () => import('./ui-elements/pages/buttons/buttons.component').then(m => m.ButtonsComponent),
            title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'images',
            loadComponent: () => import('./ui-elements/pages/images/images.component').then(m => m.ImagesComponent),
            title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
          {
            path:'videos',
            loadComponent: () => import('./ui-elements/pages/videos/videos.component').then(m => m.VideosComponent),
            title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
          },
      ]
  },
  // auth pages
  {
    path:'signin',
    loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent),
    title:'Sign In | eDOB'
  },
  {
    path:'login',
    loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent),
    title:'Sign In | eDOB'
  },
  {
    path:'activate-account',
    loadComponent: () => import('./auth/pages/activate-account/activate-account.component').then(m => m.ActivateAccountComponent),
    title:'Activate Your Account | eDOB'
  },
  {
    path:'forgot-password',
    loadComponent: () => import('./auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title:'Forgot Password | eDOB'
  },
  {
    path:'forgot-passwordcheck',
    loadComponent: () => import('./auth/pages/forgot-passwordcheck/forgot-passwordcheck.component').then(m => m.ForgotPasswordcheckComponent),
    title:'Forgot Password | eDOB'
  },
  {
    path:'confirm-password',
    loadComponent: () => import('./auth/pages/confirm-password/confirm-password.component').then(m => m.ConfirmPasswordComponent),
    title:'Confirm Password | eDOB'
  },
  {
    path:'reset-password',
    loadComponent: () => import('./auth/pages/new-password/new-password.component').then(m => m.NewPasswordComponent),
    title:'Reset Password | eDOB'
  },
  {
    path:'verification',
    loadComponent: () => import('./auth/pages/verification/verification.component').then(m => m.VerificationComponent),
    title:'Verification | eDOB'
  },
  {
    path:'subscription-plan',
    loadComponent: () => import('./auth/pages/subscription-plan/subscription-plan.component').then(m => m.SubscriptionPlanComponent),
    title:'Choose Plan | eDOB'
  },
  {
    path:'signup',
    loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent),
    title:'Sign Up | eDOB'
  },
  // error pages
  {
    path:'**',
    loadComponent: () => import('./features/pages/other-page/not-found/not-found.component').then(m => m.NotFoundComponent),
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
