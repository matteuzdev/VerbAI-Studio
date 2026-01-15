import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { StoreService } from '../../services/store.service';

interface Message {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .chat-gradient {
      background: linear-gradient(135deg, #0B0C10 0%, #1a1c29 100%);
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .typing-dot {
      animation: typing 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `],
  template: `
    <!-- Launcher Button (Bottom Right) -->
    <button (click)="toggleChat()" 
            [class.scale-0]="isOpen()"
            class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-110 group">
      <!-- Glow Effect -->
      <span class="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-30 blur-md transition"></span>
      <span class="material-symbols-outlined text-2xl relative z-10">smart_toy</span>
    </button>

    <!-- Chat Window -->
    <div [class.opacity-0]="!isOpen()"
         [class.pointer-events-none]="!isOpen()"
         [class.translate-y-4]="!isOpen()"
         class="fixed bottom-6 right-6 z-50 w-[350px] md:w-[380px] h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 flex flex-col chat-gradient font-sans">
       
       <!-- Header -->
       <div class="h-16 bg-white/5 border-b border-white/5 flex items-center justify-between px-4 backdrop-blur-md shrink-0">
          <div class="flex items-center gap-3">
             <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center border border-white/20">
                <span class="material-symbols-outlined text-white text-sm">smart_toy</span>
             </div>
             <div>
                <h3 class="font-bold text-white text-sm">VerbAI Assistant</h3>
                <div class="flex items-center gap-1.5">
                   <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                   <span class="text-[10px] text-gray-400 uppercase tracking-wider">Online</span>
                </div>
             </div>
          </div>
          <button (click)="toggleChat()" class="text-gray-400 hover:text-white transition">
             <span class="material-symbols-outlined">expand_more</span>
          </button>
       </div>

       <!-- Messages Area -->
       <div class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" #scrollContainer>
          @for (msg of messages(); track $index) {
             <div [class.justify-end]="msg.role === 'user'" class="flex">
                <div [class.bg-blue-600]="msg.role === 'user'"
                     [class.text-white]="msg.role === 'user'"
                     [class.bg-white/10]="msg.role === 'model'"
                     [class.text-gray-200]="msg.role === 'model'"
                     [class.rounded-br-none]="msg.role === 'user'"
                     [class.rounded-bl-none]="msg.role === 'model'"
                     class="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm">
                   {{ msg.text }}
                </div>
             </div>
          }

          @if (isThinking()) {
             <div class="flex justify-start">
                <div class="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center w-16">
                   <div class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>
                   <div class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>
                   <div class="w-1.5 h-1.5 bg-gray-400 rounded-full typing-dot"></div>
                </div>
             </div>
          }
       </div>

       <!-- Input Area -->
       <div class="p-3 bg-white/5 border-t border-white/5 shrink-0">
          <div class="relative">
             <input type="text" [(ngModel)]="userInput" (keyup.enter)="sendMessage()"
                    placeholder="Ask about our stack..." 
                    class="w-full bg-black/20 text-white text-sm rounded-xl pl-4 pr-10 py-3 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition placeholder-gray-500">
             
             <button (click)="sendMessage()" 
                     [disabled]="!userInput() || isThinking()"
                     class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
                <span class="material-symbols-outlined text-lg">send</span>
             </button>
          </div>
          <div class="text-center mt-2">
             <span class="text-[10px] text-gray-600">Powered by Google Gemini</span>
          </div>
       </div>

    </div>
  `
})
export class ChatWidgetComponent implements AfterViewChecked {
  gemini = inject(GeminiService);
  store = inject(StoreService);
  
  isOpen = signal(false);
  isThinking = signal(false);
  userInput = signal('');
  messages = signal<Message[]>([]);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    // FIX: Use 'untracked' to prevent infinite loops when reading/writing signals in an effect
    effect(() => {
        const lang = this.store.language();
        
        untracked(() => {
            // Only set greeting if chat is empty, avoiding loops
            if (this.messages().length === 0) {
                this.setGreeting(lang);
            }
        });
    });
  }

  setGreeting(lang: string) {
    let text = '';
    if (lang === 'pt') {
        text = 'Olá! Sou a VerbAI. Posso ajudar com geração de conteúdo, dúvidas sobre o sistema ou engenharia web. Como posso ajudar?';
    } else if (lang === 'es') {
        text = '¡Hola! Soy VerbAI. Puedo ayudar con la generación de contenido, preguntas del sistema o ingeniería web. ¿Cómo puedo ayudar?';
    } else {
        text = 'Hello! I am VerbAI. I can help with content generation, system questions, or web engineering. How can I help?';
    }
    this.messages.set([{ role: 'model', text }]);
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', text }]);
    this.userInput.set('');
    this.isThinking.set(true);

    // Call API with Language Context
    const langName = this.store.language() === 'pt' ? 'Portuguese' : this.store.language() === 'es' ? 'Spanish' : 'English';
    const response = await this.gemini.chat(this.messages(), text, langName);

    this.isThinking.set(false);
    this.messages.update(msgs => [...msgs, { role: 'model', text: response }]);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}