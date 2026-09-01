import { Routes, PreloadAllModules } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { subscriptionGuard } from './core/guards/subscription.guard';

export const routes: Routes = [
      {
        path:'',
        loadComponent: () => import('./layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
        canActivate: [authGuard, subscriptionGuard],
        children:[
          {
            path: '',
            loadComponent: () => import('./dashboard/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
            pathMatch: 'full',
            title:
              'Dashboard | KeyVault Pro',
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./dashboard/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent),
            title: 'Dashboard | KeyVault Pro'
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
            title: 'Invoices | KeyVault Pro'
          },
          {
            path: 'invoice-detail/:invoiceId',
            loadComponent: () => import('./features/pages/invoices/invoice-detail.component').then(m => m.InvoiceDetailComponent),
            title: 'Invoice Details | KeyVault Pro'
          },
          {
            path: 'invoice-detail-two',
            loadComponent: () => import('./features/pages/invoices/invoice-detail-two.component').then(m => m.InvoiceDetailTwoComponent),
            title: 'Invoices | KeyVault Pro'
          },
          {
            path: 'subscription',
            loadComponent: () => import('./subscription/subscription.component').then(m => m.SubscriptionComponent),
            title: 'Subscription & Trial | KeyVault Pro'
          },
          {
            path: 'subscription/complete',
            loadComponent: () => import('./subscription/complete-subscription/complete-subscription.component').then(m => m.CompleteSubscriptionComponent),
            title: 'Complete Your Subscription | KeyVault Pro'
          },
          {
            path: 'clients',
            loadComponent: () => import('./clients/clients.component').then(m => m.ClientsComponent),
            title: 'Clients | KeyVault Pro'
          },
          {
            path: 'clients/add-client',
            loadComponent: () => import('./clients/add-client/add-client.component').then(m => m.AddClientComponent),
            title: 'Add New Client | KeyVault Pro'
          },
          {
            path: 'clients/:id',
            loadComponent: () => import('./clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent),
            title: 'Client Details | KeyVault Pro'
          },
          {
            path: 'clients/:id/add-document',
            loadComponent: () => import('./clients/add-document/add-document.component').then(m => m.AddDocumentComponent),
            title: 'Add Document | KeyVault Pro'
          },
          {
            path: 'clients/:id/add-contact',
            loadComponent: () => import('./clients/add-contact/add-contact.component').then(m => m.AddContactComponent),
            title: 'Add Contact | KeyVault Pro'
          },
          {
            path: 'clients/:id/add-emergency-contact',
            loadComponent: () => import('./clients/add-emergency-contact/add-emergency-contact.component').then(m => m.AddEmergencyContactComponent),
            title: 'Add Emergency Contact | KeyVault Pro'
          },
          {
            path: 'clients/:id/view-document/:docId',
            loadComponent: () => import('./clients/view-document/view-document.component').then(m => m.ViewDocumentComponent),
            title: 'View Document | KeyVault Pro'
          },
          {
            path: 'clients/:id/view-contact/:contactId',
            loadComponent: () => import('./clients/view-contact/view-contact.component').then(m => m.ViewContactComponent),
            title: 'View Contact | KeyVault Pro'
          },
          {
            path: 'clients/:id/view-emergency-contact/:contactId',
            loadComponent: () => import('./clients/view-emergency-contact/view-emergency-contact.component').then(m => m.ViewEmergencyContactComponent),
            title: 'View Emergency Contact | KeyVault Pro'
          },
          {
            path: 'keys/add-key',
            loadComponent: () => import('./keys/add-key/add-key.component').then(m => m.AddKeyComponent),
            title: 'Add New Key | KeyVault Pro'
          },
          {
            path: 'keys/view-key/:id',
            loadComponent: () => import('./keys/view-key/view-key.component').then(m => m.ViewKeyComponent),
            title: 'View Key Details | KeyVault Pro'
          },
          {
            path: 'keys/all-keys',
            loadComponent: () => import('./keys/all-keys/all-keys.component').then(m => m.AllKeysComponent),
            title: 'All Keys | KeyVault Pro'
          },
          {
            path: 'jobs',
            loadComponent: () => import('./jobs/all-jobs/all-jobs.component').then(m => m.AllJobsComponent),
            title: 'All Jobs | KeyVault Pro'
          },
              {
            path: 'jobs/create-job',
            loadComponent: () => import('./jobs/create-job/create-job.component').then(m => m.CreateJobComponent),
            title: 'Create Job | KeyVault Pro'
          },
          {
            path: 'jobs/:id',
            loadComponent: () => import('./jobs/view-job/view-job.component').then(m => m.ViewJobComponent),
            title: 'Job Details | KeyVault Pro'
          },
          {
            path: 'storage/locations',
            loadComponent: () => import('./storage/storage-locations/storage-locations.component').then(m => m.StorageLocationsComponent),
            title: 'Storage Locations | KeyVault Pro'
          },
          {
            path: 'storage/locations/add',
            loadComponent: () => import('./storage/storage-location-form/storage-location-form.component').then(m => m.StorageLocationFormComponent),
            title: 'Add Storage Location | KeyVault Pro'
          },
          {
            path: 'storage/locations/view/:id',
            loadComponent: () => import('./storage/storage-location-detail/storage-location-detail.component').then(m => m.StorageLocationDetailComponent),
            title: 'Storage Location Detail | KeyVault Pro'
          },
          {
            path: 'storage/locations/edit/:id',
            loadComponent: () => import('./storage/storage-location-form/storage-location-form.component').then(m => m.StorageLocationFormComponent),
            title: 'Edit Storage Location | KeyVault Pro'
          },
          {
            path: 'storage/locations/deactivate/:id',
            loadComponent: () => import('./storage/deactivate-storage-location/deactivate-storage-location.component').then(m => m.DeactivateStorageLocationComponent),
            title: 'Deactivate Storage Location | KeyVault Pro'
          },
          {
            path: 'storage/locations/reactivate/:id',
            loadComponent: () => import('./storage/reactivate-storage-location/reactivate-storage-location.component').then(m => m.ReactivateStorageLocationComponent),
            title: 'Reactivate Storage Location | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets',
            loadComponent: () => import('./storage/cabinet-list/cabinet-list.component').then(m => m.CabinetListComponent),
            title: 'Cabinets | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/add',
            loadComponent: () => import('./storage/add-cabinet/add-cabinet.component').then(m => m.AddCabinetComponent),
            title: 'Add Cabinet | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/edit/:id',
            loadComponent: () => import('./storage/add-cabinet/add-cabinet.component').then(m => m.AddCabinetComponent),
            title: 'Edit Cabinet | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/view/:id/hooks',
            loadComponent: () => import('./storage/cabinet-detail/hook-list.component').then(m => m.HookListComponent),
            title: 'Hook List | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/view/:id/assign-key',
            loadComponent: () => import('./storage/cabinet-detail/assign-key-to-hook.component').then(m => m.AssignKeyToHookComponent),
            title: 'Assign Key to Hook | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/view/:id/move-key',
            loadComponent: () => import('./storage/cabinet-detail/move-key-to-hook.component').then(m => m.MoveKeyToHookComponent),
            title: 'Move Key to Another Hook | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/view/:id/remove-key',
            loadComponent: () => import('./storage/cabinet-detail/remove-key-from-hook.component').then(m => m.RemoveKeyFromHookComponent),
            title: 'Remove Key from Hook | KeyVault Pro'
          },
          {
            path: 'storage/locations/cabinets/view/:id',
            loadComponent: () => import('./storage/cabinet-detail/cabinet-detail.component').then(m => m.CabinetDetailComponent),
            title: 'Cabinet Detail | KeyVault Pro'
          },
          {
            path: 'sites/add-site',
            loadComponent: () => import('./sites/add-site/add-site.component').then(m => m.AddSiteComponent),
            title: 'Add New Site | KeyVault Pro'
          },
          {
            path: 'sites/view-site/:id',
            loadComponent: () => import('./sites/view-site/view-site.component').then(m => m.ViewSiteComponent),
            title: 'Site Details | KeyVault Pro'
          },
          {
            path: 'sites/all-sites',
            loadComponent: () => import('./sites/all-sites/all-sites.component').then(m => m.AllSitesComponent),
            title: 'All Sites | KeyVault Pro'
          },
          {
            path: 'user-management',
            loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent),
            canActivate: [authGuard, permissionGuard('admin.users.manage', 'admin.roles.manage')],
            title: 'User Management | KeyVault Pro'
          },
          {
            path: 'users/add-user',
            loadComponent: () => import('./users/add-user/add-user.component').then(m => m.AddUserComponent),
            canActivate: [authGuard, permissionGuard('admin.users.manage')],
            title: 'Add User | KeyVault Pro'
          },
          {
            path: 'users/view-user/:id',
            loadComponent: () => import('./users/view-user/view-user.component').then(m => m.ViewUserComponent),
            canActivate: [authGuard, permissionGuard('admin.users.manage')],
            title: 'View User | KeyVault Pro'
          },
          {
            path: 'roles',
            loadComponent: () => import('./roles/roles-list/roles-list.component').then(m => m.RolesListComponent),
            canActivate: [authGuard, permissionGuard('admin.roles.manage')],
            title: 'Roles | KeyVault Pro'
          },
          {
            path: 'roles/add-role',
            loadComponent: () => import('./roles/add-role/add-role.component').then(m => m.AddRoleComponent),
            canActivate: [authGuard, permissionGuard('admin.roles.manage')],
            title: 'Add Role | KeyVault Pro'
          },
          {
            path: 'roles/view-role',
            loadComponent: () => import('./roles/view-role/view-role.component').then(m => m.ViewRoleComponent),
            canActivate: [authGuard, permissionGuard('role.view')],
            title: 'View Role | KeyVault Pro'
          },
          {
            path: 'roles/deactivate-role',
            loadComponent: () => import('./roles/deactivate-role/deactivate-role.component').then(m => m.DeactivateRoleComponent),
            canActivate: [authGuard, permissionGuard('role.deactivate')],
            title: 'Deactivate Role | KeyVault Pro'
          },
          {
            path: 'roles/reactivate-role',
            loadComponent: () => import('./roles/reactivate-role/reactivate-role.component').then(m => m.ReactivateRoleComponent),
            canActivate: [authGuard, permissionGuard('role.reactivate')],
            title: 'Reactivate Role | KeyVault Pro'
          },
          {
            path: 'roles/delete-role',
            loadComponent: () => import('./roles/delete-role/delete-role.component').then(m => m.DeleteRoleComponent),
            canActivate: [authGuard, permissionGuard('role.delete')],
            title: 'Delete Role | KeyVault Pro'
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
             path:'buttons',
             loadComponent: () => import('./ui-elements/pages/buttons/buttons.component').then(m => m.ButtonsComponent),
             title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
           },
           {
             path:'subscription-plan',
             loadComponent: () => import('./auth/pages/subscription-plan/subscription-plan.component').then(m => m.SubscriptionPlanComponent),
             title:'Choose Plan | KeyVault Pro'
           },
       ]
  },
  // auth pages
  {
    path:'signin',
    loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent),
    title:'Sign In | KeyVault Pro'
  },
  {
    path:'login',
    loadComponent: () => import('./auth/pages/sign-in/sign-in.component').then(m => m.SignInComponent),
    title:'Sign In | KeyVault Pro'
  },
  {
    path:'activate-account',
    loadComponent: () => import('./auth/pages/activate-account/activate-account.component').then(m => m.ActivateAccountComponent),
    title:'Activate Your Account | KeyVault Pro'
  },
  {
    path:'forgot-password',
    loadComponent: () => import('./auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title:'Forgot Password | KeyVault Pro'
  },
  {
    path:'forgot-passwordcheck',
    loadComponent: () => import('./auth/pages/forgot-passwordcheck/forgot-passwordcheck.component').then(m => m.ForgotPasswordcheckComponent),
    title:'Forgot Password | KeyVault Pro'
  },
  {
    path:'confirm-password',
    loadComponent: () => import('./auth/pages/confirm-password/confirm-password.component').then(m => m.ConfirmPasswordComponent),
    title:'Confirm Password | KeyVault Pro'
  },
  {
    path:'reset-password',
    loadComponent: () => import('./auth/pages/new-password/new-password.component').then(m => m.NewPasswordComponent),
    title:'Reset Password | KeyVault Pro'
  },
  {
    path:'verification',
    loadComponent: () => import('./auth/pages/verification/verification.component').then(m => m.VerificationComponent),
    title:'Verification | KeyVault Pro'
  },
  {
    path:'subscription-trial-start',
    loadComponent: () => import('./auth/pages/subscription-trial-start/subscription-trial-start.component').then(m => m.SubscriptionTrialStartComponent),
    title:'Start Free Trial | KeyVault Pro'
  },
  {
    path:'subscription-trial-ready',
    loadComponent: () => import('./auth/pages/subscription-trial-ready/subscription-trial-ready.component').then(m => m.SubscriptionTrialReadyComponent),
    title:'Trial Ready | KeyVault Pro'
  },
  {
    path:'signup',
    loadComponent: () => import('./auth/pages/sign-up/sign-up.component').then(m => m.SignUpComponent),
    title:'Sign Up | KeyVault Pro'
  },
  // error pages
  {
    path:'**',
    loadComponent: () => import('./features/pages/other-page/not-found/not-found.component').then(m => m.NotFoundComponent),
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
