import { Injectable } from '@angular/core';
import { GoogleGenAI, Content, Part } from "@google/genai";

export interface SeoAnalysisResult {
  score: number;
  verdict: 'Excellent' | 'Good' | 'Needs Work' | 'Critical';
  proof: string; // The "Why this works"
  positive: string[];
  negative: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private customKeyKey = 'verbai_api_key_google'; // LocalStorage key

  constructor() {
    this.initAI();
  }

  // Initialize or Re-initialize (when key changes)
  initAI() {
    const storedKey = localStorage.getItem(this.customKeyKey);
    const apiKey = storedKey || process.env['API_KEY'] || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  saveApiKey(key: string) {
    localStorage.setItem(this.customKeyKey, key);
    this.initAI();
  }

  getStoredKey(): string {
    return localStorage.getItem(this.customKeyKey) || '';
  }

  // --- Copywriting (Genius Mode) ---
  async generateCopy(prompt: string, tone: string = 'professional', language: string = 'Portuguese'): Promise<string> {
    try {
      const fullPrompt = `
      ROLE: You are an elite SEO Copywriter.
      TASK: Write content based on the user request below.
      CONSTRAINTS:
      1. LANGUAGE: Output strictly in ${language}.
      2. FORMAT: Plain text ONLY. No Markdown.
      3. TONE: ${tone}.
      4. GOAL: High Conversion & SEO.
      USER REQUEST: ${prompt}. 
      Output only the final text content:`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      let cleanText = response.text || '';
      cleanText = cleanText.replace(/\*\*/g, '').replace(/#/g, '').replace(/`/g, '');
      return cleanText.trim();
    } catch (error) {
      console.error('Error generating content:', error);
      return '';
    }
  }

  // --- Image Generation (Robust: Imagen 4.0 -> Pollinations Fallback) ---
  async generateImage(prompt: string): Promise<string | null> {
    console.log("VerbAI Image Request:", prompt);
    
    // Fallback URL Generator
    const getFallbackUrl = (p: string) => {
        const encodedPrompt = encodeURIComponent(p + " realistic, 4k, tech style, high quality");
        const seed = Math.floor(Math.random() * 1000); 
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true&seed=${seed}`;
    };

    // 1. Check if we have a custom key. If not, don't even try Google (it fails often on free tier for Images)
    const storedKey = this.getStoredKey();
    if (!storedKey) {
        console.warn('No custom API Key set. Skipping Imagen 4.0 and using Pollinations.');
        return getFallbackUrl(prompt);
    }

    // 2. Try Gemini Imagen 4.0 (High Quality)
    try {
        const response = await this.ai.models.generateImages({
            model: 'imagen-4.0-generate-001', 
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (base64ImageBytes) {
            console.log("Success: Gemini Imagen 4.0");
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
    } catch (error) {
        console.warn('Gemini Image Gen failed. Falling back to Pollinations.', error);
    }

    // 3. Fallback execution
    return getFallbackUrl(prompt);
  }

  // --- SEO Tags Generation ---
  async generateSeoTags(contentDescription: string, type: 'page' | 'post' = 'page', language: string = 'Portuguese'): Promise<{ title: string, description: string, keywords: string }> {
     try {
      const prompt = `
      Act as a Technical SEO Specialist. Analyze the context below and generate a JSON SEO Pack.
      Context: ${contentDescription}.
      Language: ${language}.
      
      Requirements:
      - Title: High CTR, under 60 chars.
      - Description: Action-oriented, includes keywords, under 160 chars.
      - Keywords: 5-8 comma-separated semantic LSI keywords.
      
      Return strictly JSON: { "title": "", "description": "", "keywords": "" }`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
       console.error(error);
       return { title: '', description: '', keywords: '' };
    }
  }

  // --- Tag Suggestions ---
  async suggestTags(content: string, language: string = 'Portuguese'): Promise<string[]> {
    try {
      const prompt = `
      Analyze the following blog post content and suggest 5-7 relevant taxonomy tags.
      Content Snippet: ${content.substring(0, 1000)}...
      Language: ${language}
      
      Return strictly a JSON array of strings: ["Tag1", "Tag2", ...]`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      console.error('Tag Suggestion Error', error);
      return [];
    }
  }

  // --- Advanced SEO Scoring (Audit) ---
  async analyzeSeoQuality(content: string, currentTags: {title: string, desc: string}): Promise<SeoAnalysisResult> {
      try {
        const prompt = `
        Act as a Google Search Algorithm Simulator. Analyze the provided landing page content and metadata.
        
        Metadata:
        Title: ${currentTags.title}
        Description: ${currentTags.desc}
        
        Content Sample: ${content.substring(0, 1500)}...
        
        Task:
        1. Score it from 0 to 100 based on modern ranking factors (EEAT, keyword placement, readability).
        2. Provide a 'proof' statement explaining WHY this score is accurate based on algorithm logic (e.g., "Google penalizes titles > 60 chars" or "Keyword present in H1 increases relevance").
        3. List positive points.
        4. List negative points/fixes.

        Return strictly JSON: 
        { 
          "score": number, 
          "verdict": "Excellent" | "Good" | "Needs Work" | "Critical",
          "proof": "string (The technical explanation/proof)",
          "positive": ["string", "string"],
          "negative": ["string", "string"]
        }
        `;

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const result = JSON.parse(response.text || '{}');
        return {
            score: result.score || 50,
            verdict: result.verdict || 'Needs Work',
            proof: result.proof || 'Analysis unavailable.',
            positive: result.positive || [],
            negative: result.negative || []
        };
      } catch (e) {
          console.error(e);
          return { score: 0, verdict: 'Critical', proof: 'AI unavailable', positive: [], negative: [] };
      }
  }

  // --- Chat (Backoffice Assistant) ---
  async chat(history: {role: 'user' | 'model', text: string}[], newMessage: string, language: string = 'Portuguese'): Promise<string> {
    try {
      const systemInstruction = `You are "VerbAI", an advanced Autonomous Artificial Intelligence specialized in Web Engineering.`;
      const contents: Content[] = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: "System initialized." }] }
      ];

      history.forEach(msg => {
        contents.push({ role: msg.role, parts: [{ text: msg.text }] });
      });

      contents.push({ role: 'user', parts: [{ text: newMessage }] });

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
      });

      return response.text || "Neural link unstable.";
    } catch (error) {
      console.error('Chat Error', error);
      return "Connection to neural core unstable.";
    }
  }
}