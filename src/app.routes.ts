import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BrandKitComponent } from './components/brand-kit/brand-kit.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';
import { BlogComponent } from './components/blog/blog.component';
import { LeadsComponent } from './components/leads/leads.component';
import { ClientSiteComponent } from './components/client-site/client-site.component';
import { AdminLayoutComponent } from './components/layout/admin-layout.component';
import { PublicLandingComponent } from './components/public/public-landing.component';
import { PublicPageComponent } from './components/public/public-page.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  // Rota Pública (Home da Agência)
  { path: '', component: PublicLandingComponent },

  // Mockup do Site do Cliente (Renderizado dinamicamente via JSON)
  { path: 'site-preview', component: ClientSiteComponent },

  // Páginas Públicas
  { path: 'pricing', component: PublicPageComponent, data: { type: 'pricing' } },
  { path: 'about', component: PublicPageComponent, data: { type: 'about' } },
  { path: 'careers', component: PublicPageComponent, data: { type: 'careers' } },
  { path: 'legal/privacy', component: PublicPageComponent, data: { type: 'privacy' } },
  { path: 'legal/terms', component: PublicPageComponent, data: { type: 'terms' } },

  // Rotas Administrativas (Protegidas)
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'brand', component: BrandKitComponent },
      { path: 'editor', component: PageEditorComponent },
      { path: 'blog', component: BlogComponent },
      { path: 'leads', component: LeadsComponent },
      { path: 'settings', component: SettingsComponent },
    ]
  },
  
  { path: '**', redirectTo: '' }
];