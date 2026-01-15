import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// --- TYPES ---

export type ContentType = 'post' | 'page';
export type ContentStatus = 'draft' | 'published' | 'scheduled';
export type TaxonomyType = 'category' | 'tag';

export interface Term {
  id: string;
  type: TaxonomyType;
  name: string;
  slug: string;
  parentId?: string;
}

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  featuredImage?: string;
  status: ContentStatus;
  publishedAt?: string;
  authorId: string;
  authorName: string;
  categoryIds: string[]; 
  tagIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  notes?: string;
}

export interface SiteLink {
    label: string;
    url: string;
}

export interface SiteConfig {
    header: {
        logoText: string;
        links: SiteLink[];
    };
    footer: {
        copyright: string;
        links: SiteLink[];
    };
    robotsTxt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  plan?: 'Starter' | 'Pro' | 'Enterprise';
  status?: 'active' | 'inactive';
}

export interface User {
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
  initials: string;
  avatarUrl?: string;
}

export interface TeamMember {
  email: string;
  role: string;
  status: 'active' | 'pending';
  addedAt: string;
}

export interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  fontHeadings: string;
  fontBody: string;
  toneOfVoice: string;
  logoUrl?: string; 
  faviconUrl?: string;
}

export interface Section {
  id: string;
  type: 'hero' | 'features' | 'cta' | 'testimonials' | 'faq' | 'deep-dive' | 'stats';
  title: string;
  content: any;
  isEnabled: boolean;
}

export interface PageSeoConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

export type Language = 'en' | 'pt' | 'es';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private router = inject(Router);
  private http: HttpClient = inject(HttpClient);
  
  private readonly SESSION_KEY = 'verbai_session_v1';
  private readonly STORAGE_PREFIX = 'verbai_data_v1_';

  // System Health
  backendOnline = signal<boolean>(false); 

  // --- STATE SIGNALS ---
  terms = signal<Term[]>([]);
  contents = signal<Content[]>([]);
  leads = signal<Lead[]>([]);
  
  siteConfig = signal<SiteConfig>({
      header: { logoText: 'Agency', links: [] },
      footer: { copyright: '© 2024', links: [] },
      robotsTxt: 'User-agent: *\nDisallow:'
  });

  brandKit = signal<BrandConfig>({
    primaryColor: '#5E6AD2',
    secondaryColor: '#E9E9EB',
    fontHeadings: 'Inter',
    fontBody: 'Inter',
    toneOfVoice: 'Professional',
    logoUrl: '',
    faviconUrl: ''
  });

  pageSeo = signal<PageSeoConfig>({
    title: 'Home',
    description: 'Welcome',
    keywords: 'web'
  });

  sections = signal<Section[]>([]);

  // Auth & Global State
  currentUser = signal<User | null>(null);
  teamMembers = signal<TeamMember[]>([]);
  
  tenants = signal<Tenant[]>([
    { id: 'verbai-agency', name: 'VerbAI Agency', domain: 'verbai.com', plan: 'Enterprise', status: 'active' },
  ]);
  selectedTenantId = signal<string>('verbai-agency');
  language = signal<Language>('pt');

  // Computed Properties
  currentTenant = computed(() => this.tenants().find(t => t.id === this.selectedTenantId()));
  posts = computed(() => this.contents().filter(c => c.type === 'post'));
  pages = computed(() => this.contents().filter(c => c.type === 'page'));
  categories = computed(() => this.terms().filter(t => t.type === 'category'));
  tags = computed(() => this.terms().filter(t => t.type === 'tag'));

  constructor() {
    this.initStore();
  }

  private async initStore() {
    this.loadSession();
    this.loadTenantsList(); 
    this.loadTenantData(this.selectedTenantId());
    this.checkBackend(); 
  }

  // --- MULTI-TENANCY ---
  updateTenant(id: string) {
    this.selectedTenantId.set(id);
    this.loadTenantData(id);
  }

  private loadTenantsList() {
      const stored = localStorage.getItem('verbai_global_tenants');
      if (stored) {
          this.tenants.set(JSON.parse(stored));
      } else {
          this.saveTenantsList(this.tenants());
      }
  }

  private saveTenantsList(tenants: Tenant[]) {
      localStorage.setItem('verbai_global_tenants', JSON.stringify(tenants));
  }

  private loadTenantData(tenantId: string) {
      const prefix = `${this.STORAGE_PREFIX}${tenantId}_`;
      const storedSettings = localStorage.getItem(prefix + 'settings');
      
      if (storedSettings) {
          const data = JSON.parse(storedSettings);
          this.brandKit.set(data.brandKit);
          this.pageSeo.set(data.pageSeo);
          this.sections.set(data.sections);
          this.siteConfig.set(data.siteConfig || this.siteConfig());
      } else {
          if (tenantId === 'verbai-agency') {
              this.initializeVerbAiDefaults();
          } else {
              this.initializeNewClientDefaults();
          }
      }

      const storedContents = localStorage.getItem(prefix + 'contents');
      this.contents.set(storedContents ? JSON.parse(storedContents) : []);

      const storedLeads = localStorage.getItem(prefix + 'leads');
      this.leads.set(storedLeads ? JSON.parse(storedLeads) : []);

      const storedTerms = localStorage.getItem(prefix + 'terms');
      this.terms.set(storedTerms ? JSON.parse(storedTerms) : []);
  }

  private initializeVerbAiDefaults() {
      // Default structure is initialized, but text comes from dict() in public view
      this.brandKit.set({
          primaryColor: '#5E6AD2', 
          secondaryColor: '#E9E9EB', 
          fontHeadings: 'Inter',
          fontBody: 'Inter',
          toneOfVoice: 'Technical',
          logoUrl: '', 
          faviconUrl: ''
      });

      this.siteConfig.set({
          header: { logoText: 'VerbAI', links: [{label:'Metodologia', url:'/about'}, {label:'Preços', url:'/pricing'}] },
          footer: { copyright: '© 2024 VerbAI Inc.', links: [] },
          robotsTxt: 'User-agent: *\nDisallow:'
      });

      this.sections.set([
        { id: 'hero', type: 'hero', title: 'Hero', isEnabled: true, content: {} },
        { id: 'deep-web', type: 'deep-dive', title: 'Deep Web', isEnabled: true, content: { image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop' } },
        { id: 'deep-ai', type: 'deep-dive', title: 'Deep AI', isEnabled: true, content: { image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop' } },
        { id: 'features', type: 'features', title: 'Features', isEnabled: true, content: { items: [] } },
        { id: 'cta', type: 'cta', title: 'CTA', isEnabled: true, content: {} }
      ]);
      
      this.saveCurrentTenantData(); 
  }

  private initializeNewClientDefaults() {
      this.brandKit.set({
          primaryColor: '#0F172A',
          secondaryColor: '#22C55E',
          fontHeadings: 'Inter',
          fontBody: 'Inter',
          toneOfVoice: 'Professional',
          logoUrl: '',
          faviconUrl: ''
      });

      this.siteConfig.set({
          header: { logoText: 'My Business', links: [] },
          footer: { copyright: `© ${new Date().getFullYear()}`, links: [] },
          robotsTxt: 'User-agent: *\nDisallow:'
      });

      this.sections.set([
        { id: 'hero', type: 'hero', title: 'Hero', isEnabled: true, content: { headline_1: 'Welcome', headline_2: 'Our Website', desc: 'We provide excellent services.', ctaText: 'Learn More', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop' } },
        { id: 'features', type: 'features', title: 'Services', isEnabled: true, content: { items: [] } },
        { id: 'cta', type: 'cta', title: 'Contact', isEnabled: true, content: { title: 'Contact Us', text: 'Get in touch.', buttonLabel: 'Contact' } }
      ]);

      this.saveCurrentTenantData();
  }

  private saveCurrentTenantData() {
      const tenantId = this.selectedTenantId();
      const prefix = `${this.STORAGE_PREFIX}${tenantId}_`;

      const settings = {
          brandKit: this.brandKit(),
          pageSeo: this.pageSeo(),
          sections: this.sections(),
          siteConfig: this.siteConfig()
      };
      localStorage.setItem(prefix + 'settings', JSON.stringify(settings));
      localStorage.setItem(prefix + 'contents', JSON.stringify(this.contents()));
      localStorage.setItem(prefix + 'leads', JSON.stringify(this.leads()));
      localStorage.setItem(prefix + 'terms', JSON.stringify(this.terms()));
  }

  // --- ACTIONS ---
  updateBrandKit(config: Partial<BrandConfig>) { 
    this.brandKit.update(c => ({ ...c, ...config })); 
    this.saveCurrentTenantData();
  }
  updatePageSeo(config: Partial<PageSeoConfig>) {
    this.pageSeo.update(c => ({...c, ...config}));
    this.saveCurrentTenantData();
  }
  updateSection(id: string, content: any) { 
    this.sections.update(s => s.map(sec => sec.id === id ? { ...sec, content: { ...sec.content, ...content } } : sec)); 
    this.saveCurrentTenantData();
  }
  toggleSection(id: string) { 
    this.sections.update(s => s.map(sec => sec.id === id ? { ...sec, isEnabled: !sec.isEnabled } : sec)); 
    this.saveCurrentTenantData();
  }
  saveSiteConfig(config: SiteConfig) {
      this.siteConfig.set(config);
      this.saveCurrentTenantData();
  }

  async saveContent(content: Content) {
    this.contents.update(items => {
      const index = items.findIndex(i => i.id === content.id);
      const updated = { ...content, updatedAt: new Date().toISOString() };
      if (index >= 0) { const copy = [...items]; copy[index] = updated; return copy; }
      return [...items, { ...updated, createdAt: new Date().toISOString() }];
    });
    this.saveCurrentTenantData();
  }
  
  async deleteContent(id: string) {
    this.contents.update(items => items.filter(i => i.id !== id));
    this.saveCurrentTenantData();
  }

  saveLead(lead: Lead) {
      this.leads.update(items => {
          const index = items.findIndex(l => l.id === lead.id);
          if (index >= 0) { const copy = [...items]; copy[index] = lead; return copy; }
          return [lead, ...items];
      });
      this.saveCurrentTenantData();
  }
  updateLeadStatus(id: string, status: LeadStatus) {
    this.leads.update(items => items.map(l => l.id === id ? { ...l, status } : l));
    this.saveCurrentTenantData();
  }
  deleteLead(id: string) {
      this.leads.update(items => items.filter(l => l.id !== id));
      this.saveCurrentTenantData();
  }

  addTerm(term: Term) {
      this.terms.update(t => [...t, term]);
      this.saveCurrentTenantData();
  }
  deleteTerm(id: string) {
      this.terms.update(t => t.filter(x => x.id !== id));
      this.saveCurrentTenantData();
  }

  addTenant(tenant: Tenant) {
      this.tenants.update(ts => [...ts, tenant]);
      this.saveTenantsList(this.tenants());
      const prefix = `${this.STORAGE_PREFIX}${tenant.id}_`;
      const defaultSettings = {
          brandKit: {
            primaryColor: '#0F172A', secondaryColor: '#22C55E', fontHeadings: 'Inter', fontBody: 'Inter', toneOfVoice: 'Professional', logoUrl: '', faviconUrl: ''
          },
          siteConfig: {
            header: { logoText: tenant.name, links: [] }, footer: { copyright: '© 2024', links: [] }, robotsTxt: 'User-agent: *\nDisallow:'
          },
          sections: [
            { id: 'hero', type: 'hero', title: 'Hero', isEnabled: true, content: { headline_1: 'Welcome', headline_2: tenant.name, desc: 'Your new website.', ctaText: 'Contact', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop' } }
          ],
          pageSeo: { title: tenant.name, description: '', keywords: '' }
      };
      localStorage.setItem(prefix + 'settings', JSON.stringify(defaultSettings));
      localStorage.setItem(prefix + 'contents', '[]');
      localStorage.setItem(prefix + 'leads', '[]');
  }

  generateSitemap(): string {
      const domain = `https://${this.currentTenant()?.domain || 'verbai.com'}`;
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url>\n    <loc>${domain}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      this.posts().forEach(post => {
          if (post.status === 'published') {
              xml += `  <url>\n    <loc>${domain}/blog/${post.slug}</loc>\n    <lastmod>${post.updatedAt.split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
          }
      });
      xml += `</urlset>`;
      return xml;
  }

  generateUniqueSlug(title: string, type: ContentType, excludeId?: string): string {
    let slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    let uniqueSlug = slug;
    let counter = 1;
    const existing = this.contents();
    while (existing.some(c => c.slug === uniqueSlug && c.id !== excludeId && c.type === type)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  }

  checkBackend() { this.backendOnline.set(false); }

  attemptLogin(email: string, password: string): boolean {
    let user: User | null = null;
    if (email === 'hianto-superadmin@verbai.com' && password === 'VerbAI2k26') user = { name: 'Hianto Super', email, role: 'super_admin', initials: 'HS' };
    else if (email === 'admin@verbai.com' && password === 'admin') user = { name: 'Admin User', email, role: 'admin', initials: 'AU' };
    
    if (user) { this.currentUser.set(user); this.saveSession(user); return true; }
    return false;
  }

  quickLogin() {
    const user: User = { name: 'Quick Admin', email: 'admin@verbai.com', role: 'admin', initials: 'QA' };
    this.currentUser.set(user);
    this.saveSession(user);
    this.router.navigate(['/admin/dashboard']);
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.SESSION_KEY);
    this.router.navigate(['/']);
  }

  updateUser(updates: Partial<User>) {
    this.currentUser.update(u => u ? ({ ...u, ...updates }) : null);
    if (this.currentUser()) this.saveSession(this.currentUser()!);
  }

  inviteMember(email: string, role: string) {
    this.teamMembers.update(members => [...members, { email, role, status: 'pending', addedAt: new Date().toISOString().split('T')[0] }]);
  }

  removeMember(email: string) {
    this.teamMembers.update(members => members.filter(m => m.email !== email));
  }

  private saveSession(user: User) { localStorage.setItem(this.SESSION_KEY, JSON.stringify(user)); }
  
  private loadSession() {
    const sessionJson = localStorage.getItem(this.SESSION_KEY);
    if (sessionJson) { try { this.currentUser.set(JSON.parse(sessionJson)); } catch (e) {} }
  }

  dict = computed(() => {
    const lang = this.language();
    const t = (pt: string, en: string, es: string) => {
      if (lang === 'pt') return pt;
      if (lang === 'es') return es;
      return en;
    };
    return {
       dashboard: t('Visão Geral', 'Dashboard', 'Panel General'),
       brandKit: t('Identidade Visual', 'Brand Kit', 'Identidad Visual'),
       pageEditor: t('Editor de Páginas', 'Page Editor', 'Editor de Páginas'),
       blog: t('Blog & CMS', 'Blog & CMS', 'Blog y CMS'),
       leads: t('Leads', 'Leads', 'Prospectos'),
       clients: t('Clientes', 'Clients', 'Clientes'),
       settings: t('Configurações', 'Settings', 'Configuración'),
       tenant: t('Ambiente', 'Tenant', 'Entorno'),
       welcome: t('Olá, Creator', 'Hello, Creator', 'Hola, Creador'),
       happening: t('Gerenciando', 'Managing', 'Gestionando'),
       btn_preview: t('Ver Site', 'View Site', 'Ver Sitio'),
       btn_new_post: t('Novo Post', 'New Post', 'Nuevo Post'),
       recent_leads: t('Leads Recentes', 'Recent Leads', 'Leads Recientes'),
       view_all: t('Ver Todos', 'View All', 'Ver Todos'),
       quick_actions: t('Ações Rápidas', 'Quick Actions', 'Acciones Rápidas'),
       
       // Client/Tenants
       cli_title: t('Clientes', 'Clients', 'Clientes'),
       cli_active: t('Ativos', 'Active', 'Activos'),
       cli_new: t('Novo Cliente', 'Onboard New Client', 'Nuevo Cliente'),
       cli_manage: t('Gerenciar', 'Manage', 'Gestionar'),
       cli_view: t('Ver Site', 'View Site', 'Ver Sitio'),
       
       // Profile
       prof_title: t('Configurações da Conta', 'Account Settings', 'Configuración de Cuenta'),
       prof_tab_profile: t('Meu Perfil', 'My Profile', 'Mi Perfil'),
       prof_tab_security: t('Segurança', 'Security', 'Seguridad'),
       prof_tab_team: t('Equipe', 'Team Members', 'Equipo'),
       prof_signout: t('Sair', 'Sign Out', 'Cerrar Sesión'),
       prof_photo: t('Foto de Perfil', 'Profile Photo', 'Foto de Perfil'),
       prof_photo_desc: t('Clique para alterar.', 'Click to change.', 'Clic para cambiar.'),
       prof_name: t('Nome Completo', 'Full Name', 'Nombre Completo'),
       prof_email: t('Email', 'Email', 'Correo'),
       prof_save: t('Salvar Alterações', 'Save Changes', 'Guardar Cambios'),
       prof_curr_pass: t('Senha Atual', 'Current Password', 'Contraseña Actual'),
       prof_new_pass: t('Nova Senha', 'New Password', 'Nueva Contraseña'),
       prof_update_pass: t('Atualizar Senha', 'Update Password', 'Actualizar Contraseña'),
       prof_invite_title: t('Convidar Membro', 'Invite New Member', 'Invitar Miembro'),
       prof_invite_btn: t('Convidar', 'Invite', 'Invitar'),
       prof_role: t('Função', 'Role', 'Rol'),
       
       // Settings
       set_providers: t('Provedores de IA', 'AI Model Providers', 'Proveedores de IA'),
       set_active: t('Ativo', 'Active', 'Activo'),
       set_gemini_label: t('Chave API Google Gemini', 'Google Gemini API Key', 'Clave API Google Gemini'),
       set_gemini_desc: t('Motor Primário', 'Primary Engine', 'Motor Primario'),
       set_openai_label: t('Chave API OpenAI', 'OpenAI API Key', 'Clave API OpenAI'),
       set_save: t('Salvar Configurações', 'Save Configurations', 'Guardar Configuraciones'),
       set_export: t('Exportar Projeto', 'Export Project Source', 'Exportar Proyecto'),
       
       // Blog
       blg_posts: t('Postagens', 'Posts', 'Publicaciones'),
       blg_add: t('Adicionar Post', 'Add New Post', 'Añadir Post'),
       blg_discard: t('Descartar', 'Discard', 'Descartar'),
       blg_publish: t('Publicar', 'Publish', 'Publicar'),
       blg_update: t('Atualizar', 'Update', 'Actualizar'),
       blg_title_ph: t('Adicionar título', 'Add title', 'Añadir título'),
       blg_content_ph: t('Comece a escrever...', 'Start writing...', 'Empieza a escrever...'),
       blg_gen_title: t('Gerar Título', 'Generate Title', 'Generar Título'),
       blg_write_ai: t('Escrever com VerbAI', 'Write with VerbAI', 'Escribir con VerbAI'),
       blg_seo_intel: t('Inteligência SEO', 'SEO Intelligence', 'Inteligencia SEO'),
       blg_optimize: t('Otimizar', 'Optimize', 'Optimizar'),
       blg_meta_title: t('Meta Título', 'Meta Title', 'Meta Título'),
       blg_meta_desc: t('Meta Descrição', 'Meta Desc', 'Meta Descripción'),
       blg_gen_html: t('Gerar HTML Estilizado', 'Auto-Format HTML', 'Generar HTML Estilizado'),
       blg_html_prompt: t('Transforme o texto em HTML semântico.', 'Convert text to semantic HTML.', 'Convierte texto a HTML semántico.'),
       blg_author: t('Autor', 'Author', 'Autor'),

       // Editor
       ed_back: t('Voltar', 'Back', 'Volver'),
       ed_seo_settings: t('Configurações SEO', 'SEO Settings', 'Configuración SEO'),
       ed_view_site: t('Ver Site', 'View Site', 'Ver Sitio'),
       ed_published: t('Online', 'Published', 'Publicado'),
       ed_last_saved: t('Salvo agora', 'Just saved', 'Guardado agora'),
       ed_publish_btn: t('Publicar', 'Publish', 'Publicar'),
       ed_edit_title: t('Editar', 'Edit', 'Editar'),
       ed_verbai_upsell: t('VerbAI Add-on', 'VerbAI Add-on', 'VerbAI Extra'),
       ed_verbai_upgrade: t('Gerar com IA', 'Generate with AI', 'Generar con IA'),
       
       // Brand Kit
       bk_title: t('Brand Kit', 'Brand Kit', 'Kit de Marca'),
       bk_desc: t('Configure a identidade visual.', 'Configure visual identity.', 'Configura identidad visual.'),
       bk_logos: t('Logos', 'Logos', 'Logotipos'),
       bk_upload_logo: t('Upload', 'Upload', 'Subir'),
       bk_favicon: t('Favicon', 'Favicon', 'Favicon'),
       bk_colors: t('Cores', 'Colors', 'Colores'),
       bk_primary: t('Primária', 'Primary', 'Primario'),
       bk_secondary: t('Secundária', 'Secondary', 'Secundario'),
       bk_typography: t('Tipografia', 'Typography', 'Tipografía'),
       bk_font_heading: t('Títulos', 'Headings', 'Títulos'),
       bk_font_body: t('Corpo', 'Body', 'Cuerpo'),
       bk_tone: t('Tom de Voz', 'Tone of Voice', 'Tono de Voz'),
       bk_tone_desc: t('Personalidade da IA.', 'AI Personality.', 'Personalidad de IA.'),
       bk_save: t('Salvar', 'Save', 'Guardar'),
       bk_preview: t('Preview', 'Preview', 'Vista Previa'),
       bk_preview_feature: t('Destaque', 'Feature', 'Destacado'),
       bk_preview_headline: t('Título Exemplo', 'Example Headline', 'Título de Ejemplo'),
       bk_preview_text: t('Texto de exemplo.', 'Sample text.', 'Texto de ejemplo.'),

       // --- PUBLIC LANDING PAGE (SALES COPY VIBECODED) ---
       // HIGH IMPACT SALES COPY RESTORED & TRANSLATED
       
       lp_hero_h1: t('Sites Vibecoded.', 'Vibecoded Websites.', 'Sitios Vibecoded.'),
       lp_hero_h2: t('Escala Infinita.', 'Infinite Scale.', 'Escala Infinita.'),
       lp_hero_desc: t('Não vendemos templates. Vendemos impérios digitais autônomos. Engenharia de software, design premium e IA em uma única stack.', 'We don\'t sell templates. We sell autonomous digital empires. Software engineering, premium design, and AI in a single stack.', 'No vendemos plantillas. Vendemos imperios digitales autónomos. Ingeniería de software, diseño premium e IA en una sola pila.'),
       lp_hero_cta: t('Dominar o Mercado', 'Dominate the Market', 'Dominar el Mercado'),
       lp_hero_manifesto: t('Ler o Manifesto', 'Read Manifesto', 'Leer Manifiesto'),
       
       lp_deep_web_title: t('Engenharia', 'Engineering', 'Ingeniería'),
       lp_deep_web_highlight: t('Vibecoded.', 'Vibecoded.', 'Vibecoded.'),
       lp_deep_web_desc: t('Esqueça o WordPress. Nossos sites são aplicações compiladas na Edge, blindadas contra falhas e rápidas como o pensamento.', 'Forget WordPress. Our sites are Edge-compiled applications, bulletproof against failure and fast as thought.', 'Olvida WordPress. Nuestros sitios son aplicaciones compiladas en Edge, a prueba de balas y rápidas como el pensamiento.'),
       lp_deep_web_feat1: t('Performance Extrema (100/100 Lighthouse)', 'Extreme Performance (100/100 Lighthouse)', 'Rendimiento Extremo (100/100 Lighthouse)'),
       lp_deep_web_feat2: t('Segurança Enterprise-Grade', 'Enterprise-Grade Security', 'Seguridad de Grado Empresarial'),
       lp_deep_web_feat3: t('Arquitetura Headless', 'Headless Architecture', 'Arquitectura Headless'),

       lp_deep_ai_title: t('Inteligência', 'Intelligence', 'Inteligencia'),
       lp_deep_ai_highlight: t('Sintética.', 'Synthetic.', 'Sintética.'),
       lp_deep_ai_desc: t('O VerbAI não apenas escreve código. Ele entende seu negócio. De SEO técnico a Copywriting persuasivo, sua agência roda no piloto automático.', 'VerbAI doesn\'t just write code. It understands your business. From technical SEO to persuasive Copywriting, your agency runs on autopilot.', 'VerbAI no solo escribe código. Entiende tu negocio. Desde SEO técnico hasta Copywriting persuasivo, tu agencia funciona en piloto automático.'),
       
       lp_eco_title: t('O Ecossistema Web Design Studio', 'The Web Design Studio Ecosystem', 'El Ecosistema Web Design Studio'),
       lp_eco_desc: t('Uma suíte completa para agências que recusam a mediocridade.', 'A complete suite for agencies that refuse mediocrity.', 'Una suite completa para agencias que rechazan la mediocridad.'),
       
       lp_eco_feat1_title: t('Fábrica de Sites', 'Site Factory', 'Fábrica de Sitios'),
       lp_eco_feat1_desc: t('Gerencie múltiplos tenants com isolamento total de dados.', 'Manage multiple tenants with total data isolation.', 'Gestiona múltiples inquilinos con aislamiento total de datos.'),
       
       lp_eco_feat2_title: t('Núcleo Generativo', 'Generative Core', 'Núcleo Generativo'),
       lp_eco_feat2_desc: t('Crie campanhas inteiras com um clique usando LLMs fine-tuned.', 'Create entire campaigns with one click using fine-tuned LLMs.', 'Crea campañas enteras con un clic usando LLMs ajustados.'),
       
       lp_eco_feat3_title: t('Infraestrutura Global', 'Global Infrastructure', 'Infraestructura Global'),
       lp_eco_feat3_desc: t('Deploy instantâneo em 35 regiões globais.', 'Instant deploy across 35 global regions.', 'Despliegue instantáneo en 35 regiones globales.'),
       
       lp_eco_feat4_title: t('Colaboração Real-time', 'Real-time Collaboration', 'Colaboración en Tiempo Real'),
       lp_eco_feat4_desc: t('Edição multiplayer para equipes de alta performance.', 'Multiplayer editing for high-performance teams.', 'Edición multijugador para equipos de alto rendimiento.'),

       lp_cta_title: t('O Futuro é Vibecoded.', 'The Future is Vibecoded.', 'El Futuro es Vibecoded.'),
       lp_cta_text: t('Pare de lutar com ferramentas do passado. Junte-se à elite da engenharia web.', 'Stop struggling with tools of the past. Join the web engineering elite.', 'Deja de luchar con herramientas del pasado. Únete a la élite de la ingeniería web.'),
       lp_cta_btn: t('Iniciar Transformação', 'Start Transformation', 'Iniciar Transformación'),

       // UI Elements
       lp_edit_badge: t('Editar Seção', 'Edit Section', 'Editar Sección'),
       lp_edit_header: t('Editar Header', 'Edit Header', 'Editar Header'),
       lp_edit_footer: t('Editar Footer', 'Edit Footer', 'Editar Pie'),
       lp_version_badge: t('VerbAI v2.0: A Nova Era', 'VerbAI v2.0: The New Era', 'VerbAI v2.0: La Nueva Era'),
       lp_preview_dashboard: t('Painel de Controle: O Cérebro da Operação', 'Control Panel: The Operation Brain', 'Panel de Control: El Cerebro de la Operación'),
       lp_stats_operation: t('Uptime Garantido', 'Guaranteed Uptime', 'Uptime Garantizado'),
       lp_stats_latency: t('Latência Zero', 'Zero Latency', 'Latencia Cero'),
       lp_visual_placeholder: t('Visual Placeholder', 'Visual Placeholder', 'Marcador Visual'),
       
       // Navbar & Footer
       lp_nav_method: t('Metodologia', 'Methodology', 'Metodología'),
       lp_nav_pricing: t('Investimento', 'Investment', 'Inversión'),
       lp_nav_careers: t('Carreiras', 'Careers', 'Carreras'),
       lp_nav_about: t('Sobre Nós', 'About Us', 'Sobre Nosotros'),
       lp_login: t('Acesso Cliente', 'Client Access', 'Acceso Cliente'),
       lp_start_project: t('Contratar Studio', 'Hire Studio', 'Contratar Studio'),
       lp_footer_product: t('Produto', 'Product', 'Producto'),
       lp_footer_company: t('Empresa', 'Company', 'Empresa'),
       lp_footer_legal: t('Legal', 'Legal', 'Legal'),
       lp_footer_rights: t('Todos os direitos reservados.', 'All rights reserved.', 'Todos los derechos reservados.'),
       lp_footer_tagline: t('Web Design Studio: Onde a arte encontra a inteligência artificial.', 'Web Design Studio: Where art meets artificial intelligence.', 'Web Design Studio: Donde el arte se encuentra con la inteligencia artificial.'),
       
       // System Status
       lp_system_online: t('Sistemas Operacionais', 'Systems Operational', 'Sistemas Operativos'),
       lp_admin_access: t('Acesso Admin', 'Admin Access', 'Acceso Admin'),

       // Login Modal
       lp_restricted_access: t('Área Restrita', 'Restricted Area', 'Área Restringida'),
       lp_sign_in_desc: t('Acesse o painel de controle da sua operação.', 'Access your operation control panel.', 'Accede al panel de control de tu operación.'),
       lp_email_label: t('Email Corporativo', 'Corporate Email', 'Correo Corporativo'),
       lp_password_label: t('Chave de Acesso', 'Access Key', 'Clave de Acceso'),
       lp_invalid_creds: t('Credenciais não autorizadas.', 'Unauthorized credentials.', 'Credenciales no autorizadas.'),
       lp_authenticate: t('Entrar no Sistema', 'Enter System', 'Entrar al Sistema'),

       // Project Modal
       md_title: t('Inicie seu Império Digital', 'Start Your Digital Empire', 'Inicia tu Imperio Digital'),
       md_subtitle: t('Conte sua visão. Nós codificamos o futuro.', 'Tell us your vision. We code the future.', 'Cuéntanos tu visión. Codificamos el futuro.'),
       md_label_name: t('Nome Completo', 'Full Name', 'Nombre Completo'),
       md_label_company: t('Empresa', 'Company', 'Empresa'),
       md_label_email: t('Email', 'Email', 'Correo'),
       md_label_type: t('Tipo de Projeto', 'Project Type', 'Tipo de Proyecto'),
       md_label_details: t('Detalhes do Projeto', 'Project Details', 'Detalles del Proyecto'),
       md_ph_name: t('Seu Nome', 'Your Name', 'Tu Nombre'),
       md_ph_company: t('Sua Empresa', 'Your Company', 'Tu Empresa'),
       md_ph_email: t('seu@email.com', 'you@email.com', 'tu@correo.com'),
       md_ph_details: t('Descreva seus objetivos estratégicos...', 'Describe your strategic goals...', 'Describe tus objetivos estratégicos...'),
       md_btn_send: t('Solicitar Proposta', 'Request Proposal', 'Solicitar Propuesta'),
       md_sending: t('Processando...', 'Processing...', 'Procesando...'),
       md_success_title: t('Solicitação Recebida', 'Request Received', 'Solicitud Recibida'),
       md_success_desc: t('Nossa equipe de engenharia analisará sua demanda.', 'Our engineering team will analyze your request.', 'Nuestro equipo de ingeniería analizará tu solicitud.'),
       md_close: t('Fechar', 'Close', 'Cerrar'),
       
       // Page: Privacy
       pg_privacy_title: t('Política de Privacidade', 'Privacy Policy', 'Política de Privacidad'),
       pg_privacy_sub: t('Privacidade é um direito fundamental.', 'Privacy is a fundamental right.', 'La privacidad es un derecho fundamental.'),
       pg_privacy_body: t(
           '<p class="mb-4">Data Efetiva: Outubro 2024</p><h3 class="text-2xl text-white font-bold mt-8 mb-4">1. Coleta de Dados</h3><p>Coletamos apenas o estritamente necessário para a operação do sistema.</p>', 
           '<p class="mb-4">Effective Date: October 2024</p><h3 class="text-2xl text-white font-bold mt-8 mb-4">1. Data Collection</h3><p>We collect only what is strictly necessary for system operation.</p>',
           '<p class="mb-4">Fecha Efectiva: Octubre 2024</p><h3 class="text-2xl text-white font-bold mt-8 mb-4">1. Recolección de Datos</h3><p>Solo recopilamos lo estrictamente necesario para la operación del sistema.</p>'
       ),

       // Page: Terms
       pg_terms_title: t('Termos de Serviço', 'Terms of Service', 'Términos de Servicio'),
       pg_terms_sub: t('As regras da nossa tecnologia.', 'The rules of our technology.', 'Las reglas de nuestra tecnología.'),
       pg_terms_body: t(
           '<p>Ao utilizar o ecossistema VerbAI, você concorda com nossos padrões de qualidade e uso.</p>',
           '<p>By using the VerbAI ecosystem, you agree to our quality and usage standards.</p>',
           '<p>Al utilizar el ecosistema VerbAI, aceptas nuestros estándares de calidad y uso.</p>'
       ),

       // Page: About
       pg_about_title: t('Sobre o Web Design Studio', 'About Web Design Studio', 'Sobre Web Design Studio'),
       pg_about_sub: t('Somos a vanguarda da web.', 'We are the vanguard of the web.', 'Somos la vanguardia de la web.'),
       pg_about_body: t(
           '<p class="mb-6">O Web Design Studio nasceu de uma frustração: a web moderna tornou-se lenta, insegura e genérica. <strong>Nós existimos para corrigir isso.</strong></p>',
           '<p class="mb-6">Web Design Studio was born from frustration: the modern web has become slow, insecure, and generic. <strong>We exist to fix this.</strong></p>',
           '<p class="mb-6">Web Design Studio nació de una frustración: la web moderna se ha vuelto lenta, insegura y genérica. <strong>Existimos para arreglar esto.</strong></p>'
       ),

       // Page: Pricing
       pg_price_title: t('Investimento Estratégico', 'Strategic Investment', 'Inversión Estratégica'),
       pg_price_sub: t('Soluções escaláveis para negócios ambiciosos.', 'Scalable solutions for ambitious businesses.', 'Soluciones escalables para negocios ambiciosos.'),
       pg_price_starter: t('Growth', 'Growth', 'Crecimiento'),
       pg_price_enterprise: t('Dominância', 'Dominance', 'Dominancia'),
       pg_price_contact: t('Consultar Especialista', 'Consult Specialist', 'Consultar Especialista'),
       pg_price_start: t('Iniciar Agora', 'Start Now', 'Iniciar Ahora'),

       // Page: Careers
       pg_career_title: t('Carreiras', 'Careers', 'Carreras'),
       pg_career_sub: t('Junte-se à elite.', 'Join the elite.', 'Únete a la élite.'),
       pg_career_role1: t('Arquiteto de Soluções Senior', 'Senior Solutions Architect', 'Arquitecto de Soluciones Senior'),
       pg_career_role2: t('Engenheiro de Prompt IA', 'AI Prompt Engineer', 'Ingeniero de Prompt IA'),
       
       // Stats
       stat_leads: t('Leads Qualificados', 'Qualified Leads', 'Leads Calificados'),
       stat_views: t('Impressões', 'Impressions', 'Impresiones'),
       stat_bounce: t('Taxa de Conversão', 'Conversion Rate', 'Tasa de Conversión'),
       stat_session: t('Tempo de Sessão', 'Session Time', 'Tiempo de Sesión'),
       
       // Tutorial
       tut_title: t('Setup do Ecossistema', 'Ecosystem Setup', 'Configuración del Ecosistema'),
       tut_step1: t('Identidade Visual', 'Visual Identity', 'Identidad Visual'),
       tut_step2: t('Arquitetura de Conteúdo', 'Content Architecture', 'Arquitectura de Contenido'),
       tut_step3: t('Deploy Global', 'Global Deploy', 'Despliegue Global'),
       tut_btn_start: t('Configurar Agora', 'Configure Now', 'Configurar Ahora'),
       tut_status_done: t('Concluído', 'Completed', 'Completado'),
       tut_status_todo: t('Pendente', 'Pending', 'Pendiente')
    };
  });

  setLanguage(lang: Language) {
    this.language.set(lang);
  }
}