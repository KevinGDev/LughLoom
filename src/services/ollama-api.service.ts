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

  constructor(private config: AppConfigService) {}

  async generateChatStream(
    userPrompt: string,
    onChunk: (message: ChatMessage) => void
  ): Promise<ChatMessage> {

    const config = this.config.getConfig();
    if (!config.ollamaUrl || !config.model) {
      throw new Error('⚠️ Ollama configuration missing.');
    }

    const userMessage: ChatMessage = { role: RoleEnum.user, content: userPrompt };
    this.messages.push(userMessage);

    let fullMessage = '';
    let role: RoleEnum = RoleEnum.assistant;

    return new Promise(async (resolve, reject) => {
      let unlistenChunk: UnlistenFn | null = null;
      let unlistenDone: UnlistenFn | null = null;

      try {
        // 🔥 DIRECT STREAM — plus de buffering
        unlistenChunk = await listen<string>('ollama-chunk', (event) => {
          const parsedText = this.processIncomingChunk(event.payload, (r) => {
            if (r) role = r;
          });          fullMessage += parsedText;

          // Appel UI immédiat
          onChunk({ role, content: parsedText });
        });

        unlistenDone = await listen('ollama-done', () => {
          if (unlistenChunk) unlistenChunk();
          if (unlistenDone) unlistenDone();

          if (fullMessage.trim()) {
            this.messages.push({ role, content: fullMessage });
          }

          resolve({ role, content: fullMessage });
        });

        await invoke('ollama_chat_stream', {
          url: config.ollamaUrl,
          model: config.model,
          messages: this.messages
        });

      } catch (error) {
        if (unlistenChunk) unlistenChunk();
        if (unlistenDone) unlistenDone();
        reject(error);
      }
    });
  }

  private processIncomingChunk(chunk: string, roleUpdate: (role?: RoleEnum) => void): string {
    let text = '';

    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content || '';
        const role = parsed.message?.role as RoleEnum;

        roleUpdate(role);
        text += content;

      } catch (err) {
        console.warn('⚠️ Failed to parse chunk:', err, line);
      }
    }

    return text;
  }
}
