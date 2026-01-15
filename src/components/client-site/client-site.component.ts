import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-client-site',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen font-sans transition-colors duration-300"
         [style.font-family]="store.brandKit().fontBody"
         [style.background-color]="'#ffffff'">

      <!-- Dynamic Navbar -->
      <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
             @if(store.brandKit().logoUrl) {
                <img [src]="store.brandKit().logoUrl" class="h-10 w-auto object-contain">
             } @else {
                <span class="font-bold text-xl tracking-tight" [style.color]="store.brandKit().primaryColor">
                    {{ store.siteConfig().header.logoText }}
                </span>
             }
          </div>
          
          <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            @for(link of store.siteConfig().header.links; track $index) {
                <a href="#" class="hover:text-black transition-colors">{{ link.label }}</a>
            }
          </div>

          <button class="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg transform hover:scale-105 transition-all"
                  [style.background-color]="store.brandKit().primaryColor">
             Contact Us
          </button>
        </div>
      </nav>

      <!-- Dynamic Sections Rendering -->
      <main>
        @for (section of store.sections(); track section.id) {
           @if (section.isEnabled) {
              
              <!-- HERO -->
              @if (section.type === 'hero') {
                 <section class="relative py-24 px-6 overflow-hidden">
                    <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div class="space-y-6 z-10">
                            <h1 class="text-5xl md:text-7xl font-bold leading-tight text-gray-900" 
                                [style.font-family]="store.brandKit().fontHeadings">
                                {{ section.content.headline_1 }}
                                <br/>
                                <span [style.color]="store.brandKit().secondaryColor">{{ section.content.headline_2 }}</span>
                            </h1>
                            <p class="text-xl text-gray-500 leading-relaxed max-w-lg">
                                {{ section.content.desc }}
                            </p>
                            <div class="pt-4">
                                <button class="px-8 py-4 rounded-lg text-white font-bold text-lg shadow-xl hover:opacity-90 transition-opacity"
                                        [style.background-color]="store.brandKit().primaryColor">
                                    {{ section.content.ctaText }}
                                </button>
                            </div>
                        </div>
                        
                        <div class="relative h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl bg-gray-100 group">
                            @if (section.content.image) {
                                <img [src]="section.content.image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                            } @else {
                                <div class="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                    <span class="material-symbols-outlined text-6xl">image</span>
                                </div>
                            }
                        </div>
                    </div>
                 </section>
              }

              <!-- STATS -->
              @if (section.type === 'stats') {
                  <section class="py-12 border-y border-gray-100 bg-gray-50/50">
                      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                          @for (item of section.content.items; track $index) {
                              <div class="p-4">
                                  <div class="text-4xl font-bold mb-2" [style.color]="store.brandKit().primaryColor">{{ item.value }}</div>
                                  <div class="text-sm font-bold text-gray-400 uppercase tracking-widest">{{ item.label }}</div>
                              </div>
                          }
                      </div>
                  </section>
              }

              <!-- DEEP DIVE -->
              @if (section.type === 'deep-dive') {
                  <section class="py-24 px-6">
                      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16"
                           [class.md:flex-row-reverse]="section.content.align === 'right'">
                          
                          <div class="flex-1 space-y-6">
                              <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                                  {{ section.content.badge || 'Feature' }}
                              </span>
                              <h2 class="text-4xl font-bold text-gray-900">
                                  {{ section.content.title }} <span [style.color]="store.brandKit().secondaryColor">{{ section.content.highlight }}</span>
                              </h2>
                              <p class="text-lg text-gray-500 leading-relaxed">
                                  {{ section.content.desc }}
                              </p>
                          </div>

                          <div class="flex-1 w-full relative">
                              <div class="aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
                                  @if (section.content.image) {
                                      <img [src]="section.content.image" class="w-full h-full object-cover">
                                  } @else {
                                      <div class="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
                                          <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">dashboard</span>
                                          <p class="text-gray-400 text-sm">Visual Placeholder</p>
                                      </div>
                                  }
                              </div>
                              <!-- Decorative blob -->
                              <div class="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-gray-100 to-transparent rounded-full blur-3xl opacity-50"></div>
                          </div>

                      </div>
                  </section>
              }

              <!-- FEATURES GRID -->
              @if (section.type === 'features') {
                  <section class="py-24 px-6 bg-gray-900 text-white">
                      <div class="max-w-7xl mx-auto">
                          <h2 class="text-3xl font-bold mb-16 text-center">Ecosystem</h2>
                          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              @for (item of section.content.items; track $index) {
                                  <div [class.md:col-span-2]="item.colSpan === 2" class="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                      <h3 class="text-xl font-bold mb-3" [style.color]="store.brandKit().secondaryColor">{{ item.title }}</h3>
                                      <p class="text-gray-400 leading-relaxed text-sm">{{ item.desc }}</p>
                                  </div>
                              }
                          </div>
                      </div>
                  </section>
              }

              <!-- CTA -->
              @if (section.type === 'cta') {
                  <section class="py-32 px-6 text-center relative overflow-hidden">
                      <div class="absolute inset-0 opacity-10 pointer-events-none" 
                           [style.background]="'radial-gradient(circle at center, ' + store.brandKit().primaryColor + ', transparent 70%)'"></div>
                      
                      <div class="relative z-10 max-w-3xl mx-auto space-y-8">
                          <h2 class="text-5xl font-bold text-gray-900">{{ section.content.title }}</h2>
                          <p class="text-xl text-gray-500">{{ section.content.text }}</p>
                          <button class="px-10 py-4 rounded-full text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform"
                                  [style.background-color]="store.brandKit().primaryColor">
                              {{ section.content.buttonLabel }}
                          </button>
                      </div>
                  </section>
              }

           }
        }
      </main>

      <!-- Footer -->
      <footer class="bg-gray-50 border-t border-gray-200 pt-16 pb-8 px-6">
          <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div class="text-gray-400 text-sm">
                  {{ store.siteConfig().footer.copyright }}
              </div>
              <div class="flex gap-6">
                  @for (link of store.siteConfig().footer.links; track $index) {
                      <a href="#" class="text-sm font-bold text-gray-500 hover:text-gray-900">{{ link.label }}</a>
                  }
              </div>
          </div>
      </footer>

      <!-- ADMIN FLOATING BUTTON (The "Access Backend" Feature) -->
      <div class="fixed bottom-6 left-6 z-50 group">
          <button (click)="goBackToAdmin()" class="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-full shadow-2xl hover:bg-gray-800 transition-all cursor-pointer border border-gray-700">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span class="font-bold text-sm">Admin Access</span>
              <span class="material-symbols-outlined text-sm text-gray-400 group-hover:text-white transition">arrow_forward</span>
          </button>
          
          <!-- Tooltip hint -->
          <div class="absolute bottom-full left-0 mb-3 w-48 bg-white text-gray-800 text-xs p-3 rounded-lg shadow-xl border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p><strong>Client View Mode</strong></p>
              <p class="text-gray-500 mt-1">This is how the client sees their site. Click to return to the CMS.</p>
          </div>
      </div>

    </div>
  `
})
export class ClientSiteComponent {
  store = inject(StoreService);
  router = inject(Router);

  goBackToAdmin() {
      // Simulate authentication check or smooth transition
      this.router.navigate(['/admin/dashboard']);
  }
}
