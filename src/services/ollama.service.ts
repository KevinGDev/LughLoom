import {Injectable} from '@angular/core';
import {environments} from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class OllamaService {

  constructor() {
  }

  messages: {
    role: string,
    content: string
  }[] = [];

  async generateChatStream(
    userPrompt: string,
    onChunk: (message: { role: string; content: string }) => void
  ): Promise<{ role: string; content: string }> {
    const userMessage = {
      role: 'user',
      content: userPrompt
    };
    this.messages.push(userMessage);

    const body = {
      model: environments.model,
      messages: this.messages,
      stream: true
    };

    const response = await fetch(environments.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) throw new Error('Stream non lisible');

    let assistantResponse = '';
    let role = 'assistant'; // valeur par défaut

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, {stream: true});

      for (const line of chunk.split('\n')) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed.message?.content || '';
            role = parsed.message?.role || role;
            assistantResponse += content;

            // ⬅️ envoie rôle + contenu au composant
            onChunk({
              role,
              content
            });

          } catch (err) {
            console.warn('Erreur de parsing JSON stream :', err, line);
          }
        }
      }
    }

    const assistantMessage = {
      role,
      content: assistantResponse
    };

    if (assistantResponse.trim()) {
      this.messages.push(assistantMessage);
    }

    return assistantMessage;
  }


}
