import { Component, inject, signal, ElementRef, ViewChildren, QueryList, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, Section } from '../../services/store.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes marquee {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }

    @keyframes typing {
      0% { width: 0 }
      50% { width: 100% }
      90% { width: 100% }
      100% { width: 0 }
    }

    @keyframes bar-grow {
      0% { height: 10% }
      100% { height: var(--target-height) }
    }

    .animate-on-scroll {
      opacity: 0;
      transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(40px);
    }

    .animate-on-scroll.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .marquee-container {
      mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    }
    
    .marquee-content {
      animation: marquee 40s linear infinite;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }

    .glass-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .grid-bg {
      background-size: 50px 50px;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
    }

    .typing-cursor::after {
      content: '|';
      animation: blink 1s step-start infinite;
    }

    @keyframes blink { 50% { opacity: 0; } }

    /* Custom Input Styles */
    .linear-input {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.2s;
    }
    .linear-input:focus {
      border-color: #8B5CF6;
      background: rgba(0,0,0,0.6);
      outline: none;
      box-shadow: 0 0 0 1px #8B5CF6;
    }

    .editor-mode-hover {
        position: relative;
        border: 1px dashed transparent;
        transition: border-color 0.2s;
    }
    .editor-mode-hover:hover {
        border-color: #3b82f6;
        cursor: pointer;
    }
    .edit-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        display: none;
        z-index: 50;
    }
    .editor-mode-hover:hover .edit-badge {
        display: block;
    }
  `],
  template: `
    <div class="min-h-screen flex flex-col font-sans bg-[#0B0C10] text-gray-300 overflow-x-hidden selection:bg-purple-500/30 selection:text-white relative"
         [style.font-family]="store.brandKit().fontBody">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 grid-bg pointer-events-none z-0"></div>
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <!-- Navigation -->
      <nav class="absolute top-0 w-full z-50 border-b border-white/5 bg-[#0B0C10]/80 backdrop-blur-xl transition-all duration-300" 
           [class.editor-mode-hover]="isEditorMode" (click)="handleEdit('global_header')">
        <div class="edit-badge">{{ store.dict().lp_edit_header }}</div>
        <div class="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" routerLink="/">
             @if(store.brandKit().logoUrl) {
                <img [src]="store.brandKit().logoUrl" class="h-8 w-auto">
             } @else {
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#grad1)" fill-opacity="0.5"/>
                <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" stroke="url(#grad2)" stroke-width="2" stroke-linejoin="round"/>
                <path d="M16 16V30" stroke="url(#grad2)" stroke-width="2" stroke-linecap="round"/>
                <path d="M9 12.5L16 16L23 12.5" stroke="white" stroke-opacity="0.5" stroke-width="1"/>
                <circle cx="16" cy="9" r="2" fill="white"/>
                <defs>
                    <linearGradient id="grad1" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#8B5CF6"/>
                    <stop offset="1" stop-color="#3B82F6"/>
                    </linearGradient>
                    <linearGradient id="grad2" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#A78BFA"/>
                    <stop offset="1" stop-color="#60A5FA"/>
                    </linearGradient>
                </defs>
                </svg>
             }
             <span class="font-bold text-xl tracking-tight text-white">{{ store.siteConfig().header.logoText }}</span>
          </div>
          
          <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
             <a routerLink="/about" class="hover:text-white transition-colors duration-200">{{ store.dict().lp_nav_method }}</a>
             <a routerLink="/pricing" class="hover:text-white transition-colors duration-200">{{ store.dict().lp_nav_pricing }}</a>
          </div>

          <div class="flex items-center gap-4">
             <!-- Language Switcher (Visible on Public Site) -->
             @if (!isEditorMode) {
               <div class="flex items-center gap-2 mr-2">
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
             }

             <button class="hidden md:block text-xs font-medium text-gray-400 hover:text-white transition" (click)="openLogin()">{{ store.dict().lp_login }}</button>
             <button (click)="openProjectModal()" class="px-4 py-1.5 rounded-full text-black text-xs font-bold transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105 bg-white">
                {{ store.dict().lp_start_project }}
             </button>
          </div>
        </div>
      </nav>

      <main class="flex-1 relative z-10 pt-24">
        
        <!-- HERO SECTION -->
        @if (getSection('hero'); as hero) {
           @if (hero.isEnabled) {
            <section 
              (click)="handleEdit(hero.id)" 
              [class.editor-mode-hover]="isEditorMode"
              class="relative pt-20 pb-20 md:pt-32 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
              
              <!-- DYNAMIC HERO IMAGE BACKGROUND -->
              @if (hero.content.image) {
                  <div class="absolute inset-0 z-0">
                      <img [src]="hero.content.image" class="w-full h-full object-cover opacity-40 blur-sm scale-105">
                      <div class="absolute inset-0 bg-gradient-to-b from-[#0B0C10] via-transparent to-[#0B0C10]"></div>
                  </div>
              }

              <div class="edit-badge">{{ store.dict().lp_edit_badge }}</div>

              <div #animateItem class="animate-on-scroll max-w-5xl mx-auto space-y-8 relative z-20">
                
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-purple-300 mb-6 hover:bg-white/10 transition cursor-pointer">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  {{ store.dict().lp_version_badge }}
                  <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>

                <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.1]" [style.font-family]="store.brandKit().fontHeadings">
                  <span class="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                    {{ isEditorMode && hero.content.headline_1 ? hero.content.headline_1 : store.dict().lp_hero_h1 }}
                  </span>
                  <br/>
                  <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient">
                    {{ isEditorMode && hero.content.headline_2 ? hero.content.headline_2 : store.dict().lp_hero_h2 }}
                  </span>
                </h1>
                
                <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                   {{ isEditorMode && hero.content.desc ? hero.content.desc : store.dict().lp_hero_desc }}
                </p>
                
                <div class="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                  <button (click)="openProjectModal()" [style.background-color]="store.brandKit().primaryColor" [style.color]="'white'" class="h-12 px-8 rounded-full font-semibold text-sm transition hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center gap-2">
                    {{ isEditorMode && hero.content.ctaText ? hero.content.ctaText : store.dict().lp_hero_cta }}
                    <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button routerLink="/about" class="h-12 px-8 rounded-full text-white font-medium text-sm border border-white/10 hover:bg-white/5 transition flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-gray-400">keyboard_command_key</span>
                    {{ store.dict().lp_hero_manifesto }}
                  </button>
                </div>
              </div>

              <!-- Hero Image Abstract (Live Code Dashboard) -->
              @if (!hero.content.image) {
                <div #animateItem class="animate-on-scroll mt-24 relative w-full max-w-[1200px] mx-auto perspective-1000 group">
                    <div class="relative bg-[#0F1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl aspect-[16/9] md:aspect-[16/8] flex flex-col">
                        <div class="h-10 border-b border-white/5 bg-[#161821] flex items-center px-4 gap-2">
                            <div class="flex gap-2">
                                <div class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                <div class="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                <div class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            </div>
                        </div>
                        <div class="flex-1 bg-[#0B0C10] p-6 flex items-center justify-center">
                            <p class="text-gray-600 text-sm">{{ store.dict().lp_preview_dashboard }}</p>
                        </div>
                    </div>
                </div>
              }
            </section>
           }
        }

        <!-- DEEP DIVES (ZIG ZAG) -->
        <section class="py-32 px-6">
           <div class="max-w-[1200px] mx-auto space-y-32">
             
             <!-- Deep Web -->
             @if (getSection('deep-web'); as web) {
                @if (web.isEnabled) {
                    <div (click)="handleEdit(web.id)" [class.editor-mode-hover]="isEditorMode" #animateItem class="animate-on-scroll flex flex-col md:flex-row items-center gap-16 relative">
                        <div class="edit-badge">{{ store.dict().lp_edit_badge }}</div>
                        <div class="flex-1 space-y-6">
                            <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                <span class="material-symbols-outlined">code_blocks</span>
                            </div>
                            <h2 class="text-4xl font-bold text-white">
                                {{ isEditorMode && web.content.title ? web.content.title : store.dict().lp_deep_web_title }} <br/> 
                                <span class="text-purple-400">{{ isEditorMode && web.content.highlight ? web.content.highlight : store.dict().lp_deep_web_highlight }}</span>
                            </h2>
                            <p class="text-lg text-gray-400 leading-relaxed">
                                {{ isEditorMode && web.content.desc ? web.content.desc : store.dict().lp_deep_web_desc }}
                            </p>
                            <ul class="space-y-4 pt-4">
                                <li class="flex items-center gap-3 text-sm text-gray-300">
                                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold text-[10px]">✓</span>
                                    {{ store.dict().lp_deep_web_feat1 }}
                                </li>
                                <li class="flex items-center gap-3 text-sm text-gray-300">
                                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold text-[10px]">✓</span>
                                    {{ store.dict().lp_deep_web_feat2 }}
                                </li>
                                <li class="flex items-center gap-3 text-sm text-gray-300">
                                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold text-[10px]">✓</span>
                                    {{ store.dict().lp_deep_web_feat3 }}
                                </li>
                            </ul>
                        </div>
                        <div class="flex-1 w-full">
                            @if (web.content.image) {
                                <img [src]="web.content.image" class="rounded-2xl shadow-2xl border border-white/10 w-full h-auto object-cover aspect-video">
                            } @else {
                                <div class="glass-card rounded-2xl p-3 aspect-square relative bg-[#161821] flex items-center justify-center">
                                    <span class="text-gray-600">{{ store.dict().lp_visual_placeholder }}</span>
                                </div>
                            }
                        </div>
                    </div>
                }
             }

             <!-- Deep AI -->
             @if (getSection('deep-ai'); as ai) {
                @if (ai.isEnabled) {
                    <div (click)="handleEdit(ai.id)" [class.editor-mode-hover]="isEditorMode" #animateItem class="animate-on-scroll flex flex-col md:flex-row-reverse items-center gap-16 relative">
                        <div class="edit-badge">{{ store.dict().lp_edit_badge }}</div>
                        <div class="flex-1 space-y-6">
                            <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                <span class="material-symbols-outlined">smart_toy</span>
                            </div>
                            <h2 class="text-4xl font-bold text-white">
                                {{ isEditorMode && ai.content.title ? ai.content.title : store.dict().lp_deep_ai_title }} <br/> 
                                <span class="text-blue-400">{{ isEditorMode && ai.content.highlight ? ai.content.highlight : store.dict().lp_deep_ai_highlight }}</span>
                            </h2>
                            <p class="text-lg text-gray-400 leading-relaxed">
                                {{ isEditorMode && ai.content.desc ? ai.content.desc : store.dict().lp_deep_ai_desc }}
                            </p>
                            <div class="grid grid-cols-2 gap-4 pt-4">
                                <div class="p-4 rounded-lg bg-white/5 border border-white/5">
                                    <div class="text-2xl font-bold text-white mb-1">24/7</div>
                                    <div class="text-xs text-gray-500 uppercase tracking-widest">{{ store.dict().lp_stats_operation }}</div>
                                </div>
                                <div class="p-4 rounded-lg bg-white/5 border border-white/5">
                                    <div class="text-2xl font-bold text-white mb-1">0s</div>
                                    <div class="text-xs text-gray-500 uppercase tracking-widest">{{ store.dict().lp_stats_latency }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 w-full">
                           @if (ai.content.image) {
                                <img [src]="ai.content.image" class="rounded-2xl shadow-2xl border border-white/10 w-full h-auto object-cover aspect-video">
                           } @else {
                               <div class="glass-card rounded-2xl p-2 aspect-square relative bg-gradient-to-br from-[#0F1117] to-[#161821] flex items-center justify-center">
                                   <span class="text-blue-500 font-mono">AI_AGENT_ACTIVE</span>
                               </div>
                           }
                        </div>
                    </div>
                }
             }

           </div>
        </section>

        <!-- BENTO GRID ECOSYSTEM -->
        @if (getSection('features'); as feat) {
            @if(feat.isEnabled) {
                <section (click)="handleEdit(feat.id)" [class.editor-mode-hover]="isEditorMode" class="py-24 px-6 border-t border-white/5 relative">
                   <div class="edit-badge">{{ store.dict().lp_edit_badge }}</div>
                   <div class="max-w-[1200px] mx-auto">
                        <div #animateItem class="animate-on-scroll text-center mb-16 max-w-2xl mx-auto">
                        <h2 class="text-3xl font-bold text-white mb-4">{{ store.dict().lp_eco_title }}</h2>
                        <p class="text-gray-400">{{ store.dict().lp_eco_desc }}</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[400px]">
                            <!-- FEATURE 1 -->
                            <div class="md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between group">
                                <h3 class="text-2xl font-bold text-white mb-2">{{ store.dict().lp_eco_feat1_title }}</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">{{ store.dict().lp_eco_feat1_desc }}</p>
                            </div>
                            <!-- FEATURE 2 -->
                            <div class="md:col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between group">
                                <h3 class="text-2xl font-bold text-white mb-2">{{ store.dict().lp_eco_feat2_title }}</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">{{ store.dict().lp_eco_feat2_desc }}</p>
                            </div>
                            <!-- FEATURE 3 -->
                            <div class="md:col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between group">
                                <h3 class="text-2xl font-bold text-white mb-2">{{ store.dict().lp_eco_feat3_title }}</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">{{ store.dict().lp_eco_feat3_desc }}</p>
                            </div>
                            <!-- FEATURE 4 -->
                            <div class="md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between group">
                                <h3 class="text-2xl font-bold text-white mb-2">{{ store.dict().lp_eco_feat4_title }}</h3>
                                <p class="text-gray-400 text-sm leading-relaxed">{{ store.dict().lp_eco_feat4_desc }}</p>
                            </div>
                        </div>
                   </div>
                </section>
            }
        }

        <!-- FINAL CTA -->
        @if (getSection('cta'); as cta) {
            @if (cta.isEnabled) {
                <section (click)="handleEdit(cta.id)" [class.editor-mode-hover]="isEditorMode" class="py-32 px-6 relative overflow-hidden text-center">
                   <div class="edit-badge">{{ store.dict().lp_edit_badge }}</div>
                   <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0B0C10] to-[#0B0C10] z-0"></div>
                   <div #animateItem class="animate-on-scroll relative z-10 max-w-3xl mx-auto space-y-8">
                        <h2 class="text-5xl md:text-6xl font-bold text-white tracking-tight">
                        {{ isEditorMode && cta.content.title ? cta.content.title : store.dict().lp_cta_title }}
                        </h2>
                        <p class="text-xl text-gray-400">
                        {{ isEditorMode && cta.content.text ? cta.content.text : store.dict().lp_cta_text }}
                        </p>
                        <div class="pt-4">
                        <button (click)="openProjectModal()" class="px-10 py-5 bg-white text-black rounded-full font-bold text-base shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition transform">
                            {{ isEditorMode && cta.content.buttonLabel ? cta.content.buttonLabel : store.dict().lp_cta_btn }}
                        </button>
                        </div>
                   </div>
                </section>
            }
        }

      </main>

      <!-- Footer -->
      <footer class="border-t border-white/5 bg-[#050608] pt-20 pb-10 px-6 text-sm relative z-10" [class.editor-mode-hover]="isEditorMode" (click)="handleEdit('global_footer')">
        <div class="edit-badge">{{ store.dict().lp_edit_footer }}</div>
        <div class="max-w-[1200px] mx-auto">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div class="col-span-2">
               <div class="flex items-center gap-2 font-bold text-xl text-white mb-4">
                 {{ store.siteConfig().header.logoText }}
               </div>
               <p class="text-gray-500 max-w-xs">
                 {{ store.dict().lp_footer_tagline }}
               </p>
            </div>
            <div>
              <h4 class="font-bold text-white mb-4">{{ store.dict().lp_footer_product }}</h4>
              <ul class="space-y-2 text-gray-500">
                <li><a routerLink="/pricing" class="hover:text-white transition">{{ store.dict().lp_nav_pricing }}</a></li>
                <li><a routerLink="/about" class="hover:text-white transition">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 class="font-bold text-white mb-4">{{ store.dict().lp_footer_company }}</h4>
              <ul class="space-y-2 text-gray-500">
                <li><a routerLink="/about" class="hover:text-white transition">{{ store.dict().lp_nav_about }}</a></li>
                <li><a routerLink="/careers" class="hover:text-white transition">{{ store.dict().lp_nav_careers }}</a></li>
              </ul>
            </div>
            <div>
               <h4 class="font-bold text-white mb-4">{{ store.dict().lp_footer_legal }}</h4>
               <ul class="space-y-2 text-gray-500">
                 @for(link of store.siteConfig().footer.links; track $index) {
                    <li><a [routerLink]="link.url" class="hover:text-white transition">{{ link.label }}</a></li>
                 }
               </ul>
            </div>
          </div>
          
          <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
             <div class="text-gray-600">{{ store.siteConfig().footer.copyright }}</div>
             <div class="flex items-center gap-4 mt-4 md:mt-0">
               <!-- System Status -->
               <div class="flex items-center gap-2 px-3 py-1 rounded bg-white/5">
                  <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span class="text-xs text-gray-400">{{ store.dict().lp_system_online }}</span>
               </div>
               
               <!-- Quick Access Admin Link (Extremely Discreet) -->
               <button (click)="quickLogin()" class="opacity-10 hover:opacity-100 transition-opacity duration-500 p-2 text-gray-400 hover:text-white" [title]="store.dict().lp_admin_access">
                   <span class="material-symbols-outlined text-[10px]">lock</span>
               </button>
             </div>
          </div>
        </div>
      </footer>

      <!-- Floating Studio Button (If Logged In and NOT in editor mode) -->
      @if (store.currentUser() && !isEditorMode) {
        <div class="fixed bottom-8 right-8 z-50 animate-[fade-in-up_0.5s_ease-out]">
          <a routerLink="/admin/dashboard" class="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform font-bold border border-gray-200">
            <span class="material-symbols-outlined">dashboard</span>
            {{ store.dict().dashboard }}
          </a>
        </div>
      }

      <!-- Login Modal -->
      @if (showLogin()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fade-in-up_0.3s_ease-out]">
          <div class="bg-[#1C1D24] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <button (click)="closeLogin()" class="absolute top-4 right-4 text-gray-500 hover:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="p-8">
               <div class="text-center mb-6">
                 <div class="w-12 h-12 mx-auto bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                   <span class="material-symbols-outlined text-white">fingerprint</span>
                 </div>
                 <h3 class="text-xl font-bold text-white mb-2">{{ store.dict().lp_restricted_access }}</h3>
                 <p class="text-xs text-gray-500">{{ store.dict().lp_sign_in_desc }}</p>
               </div>
               
               <div class="space-y-4">
                 <div>
                   <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().lp_email_label }}</label>
                   <input type="email" [(ngModel)]="email" 
                     class="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition placeholder-gray-700" 
                     placeholder="name@verbai.com" autoFocus>
                 </div>

                 <div>
                   <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().lp_password_label }}</label>
                   <input type="password" [(ngModel)]="password" (keyup.enter)="login()"
                     class="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition placeholder-gray-700" 
                     placeholder="••••••••">
                 </div>
               </div>
               
               @if (loginError()) {
                  <p class="text-red-400 text-xs mt-4 bg-red-900/20 p-2 rounded text-center border border-red-900/30">{{ store.dict().lp_invalid_creds }}</p>
               }

               <button (click)="login()" class="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition mt-6">{{ store.dict().lp_authenticate }}</button>
            </div>
            <div class="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
          </div>
        </div>
      }

      <!-- Project Inquiry Modal -->
      @if (showProjectModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fade-in-up_0.3s_ease-out]">
          <div class="bg-[#1C1D24] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button (click)="closeProjectModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
              <span class="material-symbols-outlined">close</span>
            </button>
            
            @if (projectSubmitted()) {
              <div class="p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                 <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6 animate-pulse">
                   <span class="material-symbols-outlined text-4xl">check_circle</span>
                 </div>
                 <h3 class="text-2xl font-bold text-white mb-2">{{ store.dict().md_success_title }}</h3>
                 <p class="text-gray-400 mb-8 max-w-xs">{{ store.dict().md_success_desc }}</p>
                 <button (click)="closeProjectModal()" class="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">{{ store.dict().md_close }}</button>
              </div>
            } @else {
              <div class="p-8 overflow-y-auto">
                 <div class="mb-6">
                   <h3 class="text-2xl font-bold text-white mb-1">{{ store.dict().md_title }}</h3>
                   <p class="text-sm text-gray-500">{{ store.dict().md_subtitle }}</p>
                 </div>
                 
                 <div class="space-y-4">
                   <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().md_label_name }}</label>
                        <input type="text" [(ngModel)]="projectForm.name" class="w-full linear-input rounded-lg px-4 py-3 text-white placeholder-gray-600" [placeholder]="store.dict().md_ph_name">
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().md_label_company }}</label>
                        <input type="text" [(ngModel)]="projectForm.company" class="w-full linear-input rounded-lg px-4 py-3 text-white placeholder-gray-600" [placeholder]="store.dict().md_ph_company">
                      </div>
                   </div>

                   <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().md_label_email }}</label>
                     <input type="email" [(ngModel)]="projectForm.email" class="w-full linear-input rounded-lg px-4 py-3 text-white placeholder-gray-600" [placeholder]="store.dict().md_ph_email">
                   </div>

                   <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().md_label_type }}</label>
                     <select [(ngModel)]="projectForm.type" class="w-full linear-input rounded-lg px-4 py-3 text-white placeholder-gray-600 appearance-none">
                       <option value="" disabled selected>Select...</option>
                       <option value="Full Ecosystem">Full Ecosystem</option>
                       <option value="Web Engineering">Web Engineering</option>
                       <option value="AI Agents">AI Agents</option>
                     </select>
                   </div>

                   <div>
                     <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{{ store.dict().md_label_details }}</label>
                     <textarea [(ngModel)]="projectForm.details" rows="4" class="w-full linear-input rounded-lg px-4 py-3 text-white placeholder-gray-600 resize-none" [placeholder]="store.dict().md_ph_details"></textarea>
                   </div>
                 </div>
                 
                 <button (click)="submitProject()" [disabled]="isSubmitting()" class="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition mt-8 flex items-center justify-center gap-2 disabled:opacity-70">
                    @if (isSubmitting()) {
                      <span class="block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      {{ store.dict().md_sending }}
                    } @else {
                      {{ store.dict().md_btn_send }}
                      <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    }
                 </button>
              </div>
            }
            <div class="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 shrink-0"></div>
          </div>
        </div>
      }

    </div>
  `
})
export class PublicLandingComponent implements AfterViewInit, OnDestroy {
  store = inject(StoreService);
  router = inject(Router);
  
  // Editor Mode Inputs/Outputs
  @Input() isEditorMode = false;
  @Output() onEditSection = new EventEmitter<string>();

  currentYear = new Date().getFullYear();
  
  // Login State
  showLogin = signal(false);
  email = signal('');
  password = signal('');
  loginError = signal(false);

  // Project Modal State
  showProjectModal = signal(false);
  projectSubmitted = signal(false);
  isSubmitting = signal(false);
  projectForm = {
    name: '',
    company: '',
    email: '',
    type: '',
    details: ''
  };

  @ViewChildren('animateItem') animateItems!: QueryList<ElementRef>;
  observer!: IntersectionObserver;

  ngAfterViewInit() {
    this.setupObserver();
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  setupObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, options);

    this.animateItems.forEach(item => {
      this.observer.observe(item.nativeElement);
    });
  }

  // Helper to get section data easily in template
  getSection(id: string): Section | undefined {
    return this.store.sections().find(s => s.id === id);
  }

  handleEdit(sectionId: string) {
    if (this.isEditorMode) {
        this.onEditSection.emit(sectionId);
    }
  }

  // Quick Access Logic for Footer Icon
  quickLogin() {
    this.store.quickLogin();
  }

  // Login Logic
  openLogin() {
    if (this.isEditorMode) return;
    if (this.store.currentUser()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.showLogin.set(true);
    this.loginError.set(false);
  }

  closeLogin() {
    this.showLogin.set(false);
    this.email.set('');
    this.password.set('');
  }

  login() {
    if (this.store.attemptLogin(this.email().trim(), this.password().trim())) {
      this.closeLogin();
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.loginError.set(true);
    }
  }

  // Project Modal Logic
  openProjectModal() {
    if (this.isEditorMode) return;
    this.showProjectModal.set(true);
    this.projectSubmitted.set(false);
    this.projectForm = { name: '', company: '', email: '', type: '', details: '' };
  }

  closeProjectModal() {
    this.showProjectModal.set(false);
  }

  submitProject() {
    if (!this.projectForm.name || !this.projectForm.email) return;

    this.isSubmitting.set(true);
    
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.projectSubmitted.set(true);
    }, 1500);
  }
}