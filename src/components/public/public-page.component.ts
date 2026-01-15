import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-public-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .glass-nav {
      background: rgba(11, 12, 16, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
  `],
  template: `
    <div class="min-h-screen bg-[#0B0C10] text-gray-300 font-sans selection:bg-purple-500/30 selection:text-white">
      
      <!-- Nav -->
      <nav class="fixed top-0 w-full z-50 glass-nav h-16 flex items-center">
        <div class="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between">
           <a routerLink="/" class="flex items-center gap-2 font-bold text-white hover:opacity-80 transition">
             <div class="w-6 h-6 rounded bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center">
               <span class="material-symbols-outlined text-xs text-white">arrow_back</span>
             </div>
             {{ store.dict().ed_back }}
           </a>
           
           <!-- Lang Switcher in Page -->
           <div class="flex items-center gap-2">
              <button (click)="store.setLanguage('pt')" class="hover:scale-110 transition" title="Português" [class.opacity-50]="store.language() !== 'pt'">
                <img src="https://flagcdn.com/w20/br.png" class="w-5 h-auto rounded shadow-sm">
              </button>
              <button (click)="store.setLanguage('en')" class="hover:scale-110 transition" title="English" [class.opacity-50]="store.language() !== 'en'">
                <img src="https://flagcdn.com/w20/us.png" class="w-5 h-auto rounded shadow-sm">
              </button>
              <button (click)="store.setLanguage('es')" class="hover:scale-110 transition" title="Español" [class.opacity-50]="store.language() !== 'es'">
                <img src="https://flagcdn.com/w20/es.png" class="w-5 h-auto rounded shadow-sm">
              </button>
           </div>
        </div>
      </nav>

      <div class="pt-32 pb-20 px-6 max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
        
        <!-- Header -->
        <div class="mb-16 border-b border-white/10 pb-8">
           <span class="text-purple-400 text-sm font-bold tracking-widest uppercase mb-2 block">{{ pageContent().category }}</span>
           <h1 class="text-4xl md:text-5xl font-bold text-white mb-6">{{ pageContent().title }}</h1>
           <p class="text-xl text-gray-400 leading-relaxed">{{ pageContent().subtitle }}</p>
        </div>

        <!-- Content -->
        <div class="prose prose-invert prose-lg max-w-none">
          <div [innerHTML]="pageContent().body"></div>
        </div>

      </div>

      <!-- Simple Footer -->
      <footer class="border-t border-white/5 py-12 text-center text-sm text-gray-600">
        {{ store.siteConfig().footer.copyright }}
      </footer>
    </div>
  `
})
export class PublicPageComponent {
  route = inject(ActivatedRoute);
  store = inject(StoreService);
  currentYear = new Date().getFullYear();

  pageContent = computed(() => {
    const type = this.route.snapshot.data['type'];
    const d = this.store.dict(); // Reactive Dictionary
    
    const pages: any = {
      'privacy': {
        category: d.lp_footer_legal,
        title: d.pg_privacy_title,
        subtitle: d.pg_privacy_sub,
        body: d.pg_privacy_body
      },
      'terms': {
        category: d.lp_footer_legal,
        title: d.pg_terms_title,
        subtitle: d.pg_terms_sub,
        body: d.pg_terms_body
      },
      'about': {
        category: d.lp_footer_company,
        title: d.pg_about_title,
        subtitle: d.pg_about_sub,
        body: d.pg_about_body
      },
      'pricing': {
        category: d.lp_nav_pricing,
        title: d.pg_price_title,
        subtitle: d.pg_price_sub,
        body: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose mt-8">
            <div class="p-8 rounded-3xl bg-white/5 border border-white/10">
               <h3 class="text-xl font-bold text-white">${d.pg_price_starter}</h3>
               <div class="text-4xl font-bold text-white mt-4 mb-2">$2,000<span class="text-lg text-gray-500 font-normal">/mo</span></div>
               <ul class="space-y-3 mb-8 text-sm text-gray-300 mt-6">
                 <li class="flex gap-2">✓ Website Vibecoded</li>
                 <li class="flex gap-2">✓ 1 AI Agent</li>
                 <li class="flex gap-2">✓ Analytics</li>
               </ul>
               <button class="w-full py-3 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition">${d.pg_price_contact}</button>
            </div>
            <div class="p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 relative overflow-hidden">
               <div class="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
               <h3 class="text-xl font-bold text-white">${d.pg_price_enterprise}</h3>
               <div class="text-4xl font-bold text-white mt-4 mb-2">$8,000<span class="text-lg text-gray-500 font-normal">/mo</span></div>
               <ul class="space-y-3 mb-8 text-sm text-gray-300 mt-6">
                 <li class="flex gap-2">✓ Engineering Team</li>
                 <li class="flex gap-2">✓ Unlimited AI Agents</li>
                 <li class="flex gap-2">✓ 24/7 Support</li>
               </ul>
               <button class="w-full py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition">${d.pg_price_start}</button>
            </div>
          </div>
        `
      },
      'careers': {
        category: d.lp_nav_careers,
        title: d.pg_career_title,
        subtitle: d.pg_career_sub,
        body: `
          <div class="space-y-4 not-prose">
             <div class="p-6 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition cursor-pointer">
                <div>
                   <h4 class="text-white font-bold">${d.pg_career_role1}</h4>
                   <p class="text-sm text-gray-400">Remote • Angular / React</p>
                </div>
                <span class="material-symbols-outlined text-gray-500">arrow_forward</span>
             </div>
             <div class="p-6 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition cursor-pointer">
                <div>
                   <h4 class="text-white font-bold">${d.pg_career_role2}</h4>
                   <p class="text-sm text-gray-400">San Francisco • LLM Fine-tuning</p>
                </div>
                <span class="material-symbols-outlined text-gray-500">arrow_forward</span>
             </div>
          </div>
        `
      }
    };

    return pages[type] || pages['about'];
  });
}