import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Section, SiteLink } from '../../services/store.service';
import { GeminiService, SeoAnalysisResult } from '../../services/gemini.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PublicLandingComponent } from '../public/public-landing.component';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PublicLandingComponent],
  templateUrl: './page-editor.component.html'
})
export class PageEditorComponent {
  store = inject(StoreService);
  gemini = inject(GeminiService);
  router = inject(Router);

  activeSectionId = signal<string | null>(null);
  isGenerating = signal<boolean>(false);
  sidebarOpen = signal<boolean>(false);

  // SEO Analysis State
  seoAnalysis = signal<SeoAnalysisResult | null>(null);

  // For managing which field is currently requesting AI
  generatingField = signal<string | null>(null);

  editSection(id: string) {
    this.activeSectionId.set(id);
    this.sidebarOpen.set(true);
  }

  openPageSeo() {
    this.activeSectionId.set('PAGE_SEO');
    this.sidebarOpen.set(true);
    // Clear previous analysis when opening fresh
    this.seoAnalysis.set(null); 
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
    this.activeSectionId.set(null);
  }

  get activeSection(): Section | undefined {
    return this.store.sections().find(s => s.id === this.activeSectionId());
  }

  toggleSection(id: string) {
    this.store.toggleSection(id);
  }

  viewSite() {
    // Navigate to the client site mockup
    this.router.navigate(['/site-preview']);
  }

  getLangName(): string {
      return this.store.language() === 'pt' ? 'Portuguese' : 
             this.store.language() === 'es' ? 'Spanish' : 'English';
  }

  // --- Header/Footer Logic ---
  
  addHeaderLink() {
      const config = this.store.siteConfig();
      config.header.links.push({ label: 'New Link', url: '#' });
      this.store.saveSiteConfig(config);
  }
  
  removeHeaderLink(index: number) {
      const config = this.store.siteConfig();
      config.header.links.splice(index, 1);
      this.store.saveSiteConfig(config);
  }

  addFooterLink() {
      const config = this.store.siteConfig();
      config.footer.links.push({ label: 'Legal', url: '#' });
      this.store.saveSiteConfig(config);
  }

  removeFooterLink(index: number) {
      const config = this.store.siteConfig();
      config.footer.links.splice(index, 1);
      this.store.saveSiteConfig(config);
  }

  updateGlobalConfig() {
      this.store.saveSiteConfig(this.store.siteConfig());
  }


  // --- AI Generation ---

  async generateContent(fieldKey: string, promptContext: string) {
    if (this.isGenerating()) return;

    this.isGenerating.set(true);
    this.generatingField.set(fieldKey);

    const section = this.activeSection;
    if (!section) return;

    const tone = this.store.brandKit().toneOfVoice;
    const lang = this.getLangName();
    const prompt = `Write content for the field "${fieldKey}" in a "${section.type}" section. Context: ${promptContext}`;
    
    const result = await this.gemini.generateCopy(prompt, tone, lang);

    if (result) {
      const currentContent = { ...section.content };
      currentContent[fieldKey] = result;
      this.store.updateSection(section.id, currentContent);
    }

    this.isGenerating.set(false);
    this.generatingField.set(null);
  }

  async runSeoAudit() {
    if (this.isGenerating()) return;
    this.isGenerating.set(true);
    
    // 1. Generate Tags if missing or just optimize context
    const context = this.store.sections()
      .filter(s => s.isEnabled)
      .map(s => `${s.title}: ${JSON.stringify(s.content)}`)
      .join('; ');

    const currentSeo = this.store.pageSeo();
    
    // 2. Perform Audit
    const analysis = await this.gemini.analyzeSeoQuality(
        context, 
        { title: currentSeo.title, desc: currentSeo.description }
    );

    this.seoAnalysis.set(analysis);
    this.isGenerating.set(false);
  }

  async autoFixSeo() {
      if (this.isGenerating()) return;
      this.isGenerating.set(true);
      const lang = this.getLangName();
      
      const context = this.store.sections()
      .filter(s => s.isEnabled)
      .map(s => `${s.title}: ${JSON.stringify(s.content)}`)
      .join('; ');

      const tags = await this.gemini.generateSeoTags(context, 'page', lang);
      if (tags.title) {
        this.store.updatePageSeo({
            title: tags.title,
            description: tags.description,
            keywords: tags.keywords
        });
        // Re-run audit after fix
        this.seoAnalysis.set(null);
        await this.runSeoAudit();
      }
      this.isGenerating.set(false);
  }

  async generateImage(fieldKey: string, sectionId: string) {
      if (this.isGenerating()) return;
      this.isGenerating.set(true);
      this.generatingField.set(fieldKey);

      // Add context to the prompt automatically
      const section = this.store.sections().find(s => s.id === sectionId);
      const context = section ? `Context: ${section.title} - ${section.content.title || ''}.` : '';

      const userPrompt = window.prompt(`Describe the image to generate for ${section?.title || 'this section'}:\n(Example: Abstract neon data visualization)`);
      
      if (!userPrompt) {
          this.isGenerating.set(false);
          this.generatingField.set(null);
          return;
      }

      const fullPrompt = `${context} ${userPrompt}`;
      console.log('Requesting image with prompt:', fullPrompt);

      const imageUrl = await this.gemini.generateImage(fullPrompt);
      
      if (imageUrl) {
          if (section) {
              const currentContent = { ...section.content };
              
              // Force update the specific field
              currentContent[fieldKey] = imageUrl;
              
              console.log(`Updating section ${sectionId} field ${fieldKey} with image data length:`, imageUrl.length);
              this.store.updateSection(sectionId, currentContent);
              
              setTimeout(() => alert("Image generated successfully!"), 100);
          }
      } else {
          alert("Failed to generate image. Please check API key permissions or try a simpler prompt.");
      }

      this.isGenerating.set(false);
      this.generatingField.set(null);
  }
}