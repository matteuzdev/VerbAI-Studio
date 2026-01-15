import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../services/store.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
      <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
        <span class="material-symbols-outlined text-5xl">construction</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ title() }}</h1>
      <p class="text-gray-500 max-w-md">
        {{ message() }}
      </p>
    </div>
  `
})
export class PlaceholderComponent {
  store = inject(StoreService);
  route = inject(ActivatedRoute);

  title = computed(() => {
    const path = this.route.snapshot.url[0]?.path;
    const d = this.store.dict();
    switch(path) {
      case 'blog': return d.blog;
      case 'leads': return d.leads;
      case 'settings': return d.settings;
      default: return 'Em Construção';
    }
  });

  message = computed(() => {
    const lang = this.store.language();
    return lang === 'pt' 
      ? 'Este módulo está sendo preparado para a próxima versão do VerbAI Studio.' 
      : 'This module is being prepared for the next release of VerbAI Studio.';
  });
}