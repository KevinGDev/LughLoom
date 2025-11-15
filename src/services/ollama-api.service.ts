import { Injectable } from '@angular/core';
import { RoleEnum } from '../utils/RoleEnum';
import { HttpMethodEnum } from '../utils/HttpMethodEnum';
import { ChatMessage } from '../interfaces/chatMessageInterface';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class OllamaService {

  private readonly headers = { 'Content-Type': 'application/json' };
  private readonly decoder = new TextDecoder('utf-8');
  private readonly messages: ChatMessage[] = [];

  constructor(private config: AppConfigService) {}

  async generateChatStream(
    userPrompt: string,
    onChunk: (message: ChatMessage) => void
  ): Promise<ChatMessage> {

    const config = this.config.getConfig();
    if (!config.ollamaUrl || !config.model) {
      throw new Error('⚠️ Ollama configuration missing. Please update settings.');
    }

    const userMessage: ChatMessage = { role: RoleEnum.user, content: userPrompt };
    this.messages.push(userMessage);

    const response = await fetch(config.ollamaUrl, {
      method: HttpMethodEnum.post,
      headers: this.headers,
      body: JSON.stringify({
        model: config.model,
        messages: this.messages,
        stream: true,
        think: false
      })
    });

    if (!response.body) throw new Error('❌ No response stream received from Ollama');

    const { message, role } = await this.processStream(response.body, onChunk);

    if (message.trim()) {
      this.messages.push({ role, content: message });
    }

    return { role, content: message };
  }

  private async processStream(
    stream: ReadableStream<Uint8Array>,
    onChunk: (message: ChatMessage) => void
  ): Promise<{ message: string; role: string }> {

    const reader = stream.getReader();
    let role: RoleEnum = RoleEnum.assistant;
    let fullMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = this.decoder.decode(value, { stream: true });
      fullMessage += this.parseChunk(chunk, onChunk, r => (role = r || role));
    }

    return { message: fullMessage, role };
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
        onChunk({ role, content });

        output += content;

      } catch (err) {
        console.warn('⚠️ Parsing error:', err, line);
      }
    }

    return output;
  }
}
