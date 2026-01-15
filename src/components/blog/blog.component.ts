import { Component, inject, signal, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Content, Term } from '../../services/store.service';
import { GeminiService } from '../../services/gemini.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog.component.html',
  styles: [`
    /* Typography for Preview (Prose) */
    .prose h1 { font-size: 2.25em; font-weight: 800; margin-bottom: 0.8em; color: #111827; }
    .prose h2 { font-size: 1.5em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.8em; color: #1f2937; }
    .prose h3 { font-size: 1.25em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.6em; color: #374151; }
    .prose p { margin-bottom: 1.25em; line-height: 1.75; color: #4b5563; }
    .prose ul { list-style-type: disc; padding-left: 1.6em; margin-bottom: 1.25em; }
    .prose ol { list-style-type: decimal; padding-left: 1.6em; margin-bottom: 1.25em; }
    .prose li { margin-bottom: 0.5em; }
    .prose blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; font-style: italic; color: #6b7280; margin-bottom: 1.25em; }
    .prose strong { font-weight: 700; color: #111827; }
    .prose a { color: #2563eb; text-decoration: underline; }
  `]
})
export class BlogComponent {
  store = inject(StoreService);
  gemini = inject(GeminiService);

  isEditing = signal(false);
  isGenerating = false;
  isPreviewMode = signal(false);
  
  // Tag Search
  tagSearchQuery = signal('');
  suggestedTags = signal<string[]>([]); // AI Suggested
  
  // View Child for Textarea to insert formatting
  @ViewChild('editorTextarea') editorTextarea!: ElementRef<HTMLTextAreaElement>;

  sidebarSections = {
      publish: true,
      categories: true,
      tags: true,
      image: true
  };

  activePost: Content = this.getInitialPost();

  // Computed for Autocomplete
  filteredTags = computed(() => {
      const query = this.tagSearchQuery().toLowerCase();
      if (!query) return [];
      
      // Return existing tags that match query AND are not already selected
      return this.store.tags()
        .filter(t => t.name.toLowerCase().includes(query) && !this.activePost.tagIds.includes(t.id))
        .slice(0, 5);
  });

  getInitialPost(): Content {
    return {
      id: '',
      type: 'post',
      title: '',
      slug: '',
      excerpt: '',
      body: '',
      status: 'draft',
      authorId: this.store.currentUser()?.email || 'admin',
      authorName: this.store.currentUser()?.name || 'Admin',
      publishedAt: new Date().toISOString(),
      categoryIds: [],
      tagIds: [],
      seoTitle: '',
      seoDescription: '',
      keywords: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  createNewPost() {
    this.activePost = { ...this.getInitialPost(), id: Date.now().toString() };
    this.isEditing.set(true);
    this.isPreviewMode.set(false);
  }

  editPost(post: Content) {
    this.activePost = JSON.parse(JSON.stringify(post));
    this.isEditing.set(true);
    this.isPreviewMode.set(false);
  }

  cancelEdit() {
    if (confirm('Discard changes and go back?')) {
        this.isEditing.set(false);
        this.activePost = this.getInitialPost(); // Clean reset
    }
  }

  savePost() {
    if (!this.activePost.title) {
        alert('Post needs a title.');
        return;
    }
    this.ensureUniqueSlug();
    this.store.saveContent(this.activePost);
    this.isEditing.set(false);
  }

  deletePost(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
        this.store.deleteContent(id);
        if (this.isEditing() && this.activePost.id === id) {
            this.isEditing.set(false);
        }
    }
  }

  toggleSidebarSection(section: keyof typeof this.sidebarSections) {
      this.sidebarSections[section] = !this.sidebarSections[section];
  }

  updateDate(isoString: string) {
      this.activePost.publishedAt = new Date(isoString).toISOString();
  }

  getCategoryNames(post: Content): string {
      const names = post.categoryIds
        .map(id => this.store.categories().find(c => c.id === id)?.name)
        .filter(n => n)
        .join(', ');
      return names || 'Uncategorized';
  }

  toggleCategory(catId: string) {
      if (this.activePost.categoryIds.includes(catId)) {
          this.activePost.categoryIds = this.activePost.categoryIds.filter(id => id !== catId);
      } else {
          this.activePost.categoryIds.push(catId);
      }
  }

  addNewCategory(input: HTMLInputElement) {
      const name = input.value.trim();
      if (!name) return;
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newCat: Term = {
          id: `cat_${Date.now()}`,
          type: 'category',
          name: name,
          slug: slug
      };
      
      this.store.addTerm(newCat);
      this.activePost.categoryIds.push(newCat.id);
      input.value = '';
  }

  getTagName(id: string): string {
      return this.store.tags().find(t => t.id === id)?.name || 'Unknown';
  }

  // Handle Enter Key on Tag Input
  handleTagInput(event: Event) {
      const input = event.target as HTMLInputElement;
      const val = input.value.trim();
      this.tagSearchQuery.set(val);
  }

  addTagFromInput(input: HTMLInputElement) {
      const raw = input.value.trim();
      if (!raw) return;
      
      // If comma separated, handle multiple
      if (raw.includes(',')) {
          raw.split(',').forEach(t => this.addSingleTag(t.trim()));
      } else {
          this.addSingleTag(raw);
      }
      
      input.value = '';
      this.tagSearchQuery.set('');
  }

  selectTag(tag: Term) {
      if (!this.activePost.tagIds.includes(tag.id)) {
          this.activePost.tagIds.push(tag.id);
      }
      this.tagSearchQuery.set('');
  }

  addSingleTag(tagName: string) {
      if(!tagName) return;
      const existing = this.store.tags().find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (existing) {
          if (!this.activePost.tagIds.includes(existing.id)) {
              this.activePost.tagIds.push(existing.id);
          }
      } else {
          const newTag: Term = {
              id: `tag_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: 'tag',
              name: tagName,
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          };
          this.store.addTerm(newTag);
          this.activePost.tagIds.push(newTag.id);
      }
  }

  removeTag(id: string) {
      this.activePost.tagIds = this.activePost.tagIds.filter(tid => tid !== id);
  }

  // --- EDITOR TOOLBAR ---

  insertFormatting(type: string) {
      const textarea = this.editorTextarea.nativeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);
      
      let replacement = '';
      
      switch(type) {
          case 'bold': replacement = `<strong>${selectedText || 'bold text'}</strong>`; break;
          case 'italic': replacement = `<em>${selectedText || 'italic text'}</em>`; break;
          case 'h2': replacement = `<h2>${selectedText || 'Heading 2'}</h2>\n`; break;
          case 'h3': replacement = `<h3>${selectedText || 'Heading 3'}</h3>\n`; break;
          case 'ul': replacement = `<ul>\n  <li>${selectedText || 'List item'}</li>\n</ul>`; break;
          case 'quote': replacement = `<blockquote>${selectedText || 'Quote'}</blockquote>`; break;
          case 'link': replacement = `<a href="#">${selectedText || 'Link text'}</a>`; break;
          default: replacement = selectedText;
      }

      this.activePost.body = text.substring(0, start) + replacement + text.substring(end);
      
      // Restore cursor/focus (approximate)
      setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      });
  }

  // --- AI ACTIONS ---

  async generateTitle() {
    this.isGenerating = true;
    const lang = this.getLangName();
    const prompt = `Write 1 viral, click-worthy blog title about: ${this.activePost.body ? 'this content' : 'Tech, AI or Web Engineering'}.`;
    
    const res = await this.gemini.generateCopy(prompt, 'Exciting', lang);
    if (res) {
        this.activePost.title = res;
        this.updateSlugIfNew();
    }
    this.isGenerating = false;
  }

  async generateFullPost() {
    if (!this.activePost.title) {
        alert('Please enter a title first.');
        return;
    }
    this.isGenerating = true;
    const lang = this.getLangName();
    const prompt = `
    Write a comprehensive, SEO-optimized blog post (approx 600 words) for the title: "${this.activePost.title}". 
    Format using HTML tags like <h2>, <p>, <ul>, <li>, <strong>. 
    Make it visually appealing. Do not include <html> or <body> tags, just the inner content.
    `;
    
    const res = await this.gemini.generateCopy(prompt, 'Professional and engaging', lang);
    if (res) {
        this.activePost.body = res;
        await this.generateSeo();
    }
    this.isGenerating = false;
  }

  async generateStyledHtml() {
      if (!this.activePost.body) return;
      this.isGenerating = true;
      
      const brand = this.store.brandKit();
      const promptTemplate = this.store.dict().blg_html_prompt;
      
      // Inject Brand Kit into Prompt
      const formattedPrompt = promptTemplate
        .replace('%c', brand.primaryColor)
        .replace('%f', brand.fontHeadings);

      const fullContext = `
      CONTEXT: ${formattedPrompt}
      
      CONTENT TO STYLE:
      ${this.activePost.body}
      
      INSTRUCTIONS:
      - Return ONLY the HTML body content.
      - Use inline styles (style="...") to apply colors and fonts.
      - Make H2 headings use color ${brand.primaryColor}.
      - Make blockquotes have a background of ${brand.secondaryColor} with 10% opacity.
      - Ensure images are responsive (style="width:100%; height:auto;").
      `;

      const styledHtml = await this.gemini.generateCopy(fullContext, 'Code', 'English');
      
      if (styledHtml) {
          this.activePost.body = styledHtml;
      }
      this.isGenerating = false;
  }

  async generateSeo() {
    if (!this.activePost.title) return;
    this.isGenerating = true;
    const lang = this.getLangName();
    const context = `Title: ${this.activePost.title}. Content: ${this.activePost.body.substring(0, 300)}...`;
    
    const tags = await this.gemini.generateSeoTags(context, 'post', lang);
    
    if (tags.title) this.activePost.seoTitle = tags.title;
    if (tags.description) this.activePost.seoDescription = tags.description;
    if (tags.keywords) this.activePost.keywords = tags.keywords;

    this.isGenerating = false;
  }

  async generateFeaturedImage() {
      if (!this.activePost.title) {
          alert('Enter a title first to guide the image generation.');
          return;
      }
      this.isGenerating = true;
      const prompt = `Editorial illustration for a blog post titled "${this.activePost.title}". Modern, minimal, high quality.`;
      
      const url = await this.gemini.generateImage(prompt);
      if (url) {
          this.activePost.featuredImage = url;
      }
      this.isGenerating = false;
  }

  async suggestAiTags() {
      if (!this.activePost.body && !this.activePost.title) {
          alert('Write some content first.');
          return;
      }
      this.isGenerating = true;
      const lang = this.getLangName();
      const content = (this.activePost.title + ' ' + this.activePost.body);
      
      this.suggestedTags.set(await this.gemini.suggestTags(content, lang));
      this.isGenerating = false;
  }

  addSuggestedTag(tagName: string) {
      this.addSingleTag(tagName);
      // Remove from suggestion list
      this.suggestedTags.update(tags => tags.filter(t => t !== tagName));
  }

  // --- HELPERS ---

  updateSlugIfNew() {
      const isNew = !this.store.posts().find(p => p.id === this.activePost.id);
      if (isNew) {
          this.activePost.slug = this.activePost.title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
      }
  }

  ensureUniqueSlug() {
      this.activePost.slug = this.store.generateUniqueSlug(
          this.activePost.slug || 'untitled', 
          'post', 
          this.activePost.id
      );
  }

  getLangName(): string {
      return this.store.language() === 'pt' ? 'Portuguese' : 
             this.store.language() === 'es' ? 'Spanish' : 'English';
  }
}