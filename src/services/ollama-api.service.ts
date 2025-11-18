import { Injectable } from '@angular/core';
import { RoleEnum } from '../utils/RoleEnum';
import { ChatMessage } from '../interfaces/chatMessageInterface';
import { AppConfigService } from './app-config.service';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

@Injectable({
  providedIn: 'root'
})
export class OllamaService {

  private readonly messages: ChatMessage[] = [];
  private readonly STREAM_DELAY = 100; // ms entre chaque chunk affiché

  constructor(private config: AppConfigService) {}

  async generateChatStream(
    userPrompt: string,
    onChunk: (message: ChatMessage) => void
  ): Promise<ChatMessage> {

    console.log('🟢 Starting generateChatStream...');

    const config = this.config.getConfig();
    if (!config.ollamaUrl || !config.model) {
      throw new Error('⚠️ Ollama configuration missing. Please update settings.');
    }

    const userMessage: ChatMessage = { role: RoleEnum.user, content: userPrompt };
    this.messages.push(userMessage);

    let fullMessage = '';
    let role: RoleEnum = RoleEnum.assistant;
    let chunkCount = 0;

    // Buffer pour le throttling
    const chunkBuffer: string[] = [];
    let processingInterval: any = null;

    return new Promise(async (resolve, reject) => {
      let unlistenChunk: UnlistenFn | null = null;
      let unlistenDone: UnlistenFn | null = null;
      let streamFinished = false;

      // Démarrer le traitement du buffer avec un intervalle fixe
      processingInterval = setInterval(() => {
        if (chunkBuffer.length > 0) {
          const bufferedChunk = chunkBuffer.shift()!;
          const chunk = this.parseChunk(bufferedChunk, onChunk, r => (role = r || role));
          fullMessage += chunk;
          console.log(`🎨 Displayed chunk. Buffer remaining: ${chunkBuffer.length}`);
        } else if (streamFinished) {
          // Stream terminé et buffer vide
          clearInterval(processingInterval);

          console.log('✅ All chunks displayed. Full message length:', fullMessage.length);

          if (unlistenChunk) unlistenChunk();
          if (unlistenDone) unlistenDone();

          if (fullMessage.trim()) {
            this.messages.push({ role, content: fullMessage });
          }

          resolve({ role, content: fullMessage });
        }
      }, this.STREAM_DELAY);

      try {
        console.log('🟢 Setting up listeners...');

        unlistenChunk = await listen<string>('ollama-chunk', (event) => {
          chunkCount++;
          console.log(`📦 Chunk #${chunkCount} received, adding to buffer (current size: ${chunkBuffer.length})`);

          // Ajouter au buffer
          chunkBuffer.push(event.payload);
        });

        unlistenDone = await listen('ollama-done', () => {
          console.log('✅ Stream done. Total chunks received:', chunkCount);
          console.log('📊 Buffer size:', chunkBuffer.length);
          streamFinished = true;
        });

        console.log('🟢 Invoking Rust command...');
        await invoke('ollama_chat_stream', {
          url: config.ollamaUrl,
          model: config.model,
          messages: this.messages
        });
        console.log('🟢 Rust command invoked');

      } catch (error) {
        console.error('❌ Error:', error);
        if (processingInterval) clearInterval(processingInterval);
        if (unlistenChunk) unlistenChunk();
        if (unlistenDone) unlistenDone();
        reject(error);
      }
    });
  }

  private parseChunk(
    chunk: string,
    onChunk: (message: ChatMessage) => void,
    roleUpdate?: (role?: RoleEnum) => void
  ): string {
    let output = '';

    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content || '';
        const role = parsed.message?.role as RoleEnum;

        if (roleUpdate) roleUpdate(role);

        if (content) {
          onChunk({ role, content });
          output += content;
        }

      } catch (err) {
        console.warn('⚠️ Parsing error:', err, line.substring(0, 50));
      }
    }

    return output;
  }
}
