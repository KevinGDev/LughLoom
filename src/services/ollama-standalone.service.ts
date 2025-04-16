import {Injectable} from '@angular/core';
import {environments} from '../environments/environments';

interface ChatMessage {
  role: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class OllamaStandaloneService {
  private readonly messages: ChatMessage[] = [];

  constructor() {
  }

  /**
   * Envoie un prompt utilisateur à l'API et traite la réponse en streaming.
   *
   * @param userPrompt Le message de l'utilisateur
   * @param onChunk Fonction appelée à chaque portion de réponse reçue
   * @returns Le message complet de l'assistant
   */
  async generateChatStream(
    userPrompt: string,
    onChunk: (message: ChatMessage) => void
  ): Promise<ChatMessage> {
    const userMessage: ChatMessage = {role: 'user', content: userPrompt};
    this.messages.push(userMessage);

    const body = {
      model: environments.model,
      messages: this.messages,
      stream: true
    };

    const response = await this.sendRequest(body);

    if (!response.body) throw new Error('Stream non lisible');

    const {message, role} = await this.processStream(response.body, onChunk);

    if (message.trim()) {
      this.messages.push({role, content: message});
    }

    return {role, content: message};
  }

  /**
   * Envoie une requête POST à l'API avec le corps spécifié.
   *
   * @param body Le corps JSON de la requête
   * @returns La réponse HTTP
   */
  private async sendRequest(body: object): Promise<Response> {
    return fetch(environments.ollamaUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
  }

  /**
   * Traite le flux de réponse ligne par ligne et appelle le callback à chaque message.
   *
   * @param stream Le flux ReadableStream de la réponse
   * @param onChunk Callback exécuté à chaque chunk
   * @returns Le message complet de l'assistant et son rôle
   */
  private async processStream(
    stream: ReadableStream<Uint8Array>,
    onChunk: (message: ChatMessage) => void
  ): Promise<{ message: string; role: string }> {
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let assistantResponse = '';
    let role = 'assistant';

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, {stream: true});

      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content || '';
          role = parsed.message?.role || role;
          assistantResponse += content;

          onChunk({role, content});
        } catch (err) {
          console.warn('Erreur de parsing JSON stream :', err, line);
        }
      }
    }

    return {message: assistantResponse, role};
  }
}
