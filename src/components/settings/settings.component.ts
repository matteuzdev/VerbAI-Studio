import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../services/store.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  store = inject(StoreService);
  gemini = inject(GeminiService);

  // Signals for form state
  googleKey = signal('');
  openaiKey = signal(''); 
  anthropicKey = signal(''); 
  
  // SEO State
  sitemapPreview = computed(() => this.store.generateSitemap());
  
  showSuccess = signal(false);

  constructor() {
    // Load existing key
    this.googleKey.set(this.gemini.getStoredKey());
  }

  saveKeys() {
    this.gemini.saveApiKey(this.googleKey());
    this.showSuccess.set(true);
    setTimeout(() => this.showSuccess.set(false), 3000);
  }

  saveRobots() {
      // Trigger save on store (which saves global config)
      this.store.saveSiteConfig(this.store.siteConfig());
      this.showSuccess.set(true);
      setTimeout(() => this.showSuccess.set(false), 3000);
  }

  downloadSitemap() {
      const blob = new Blob([this.sitemapPreview()], { type: "text/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sitemap.xml";
      a.click();
      window.URL.revokeObjectURL(url);
  }
}