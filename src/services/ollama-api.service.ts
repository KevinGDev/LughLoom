import {Injectable} from '@angular/core';
import {environments} from '../environments/environments';
import {RoleEnum} from '../utils/RoleEnum';
import {HttpMethodEnum} from '../utils/HttpMethodEnum';

interface ChatMessage {
  role: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class OllamaService {
  private readonly _headers = {'Content-Type': 'application/json'};
  private readonly _textDecoder = 'utf-8';
  private readonly _defaultRole = RoleEnum.assistant;
  private readonly _parsingErrorMessage = 'JSON stream parsing error:';
  private readonly _newlineDelimiter = '\n';

  private readonly _messages: ChatMessage[] = [];

  constructor() {
  }

  /**
   * Sends a user message to the API and processes the streamed response.
   *
   * @param userPrompt The user's message
   * @param onChunk Callback invoked with each received message part
   * @returns The assistant's full response message
   */
  async generateChatStream(
    userPrompt: string,
    onChunk: (message: ChatMessage) => void
  ): Promise<ChatMessage> {
    const userMessage: ChatMessage = {role: RoleEnum.user, content: userPrompt};
    this._messages.push(userMessage);

    const body = this._buildRequestBody();
    const response = await this._sendRequest(body);

    if (!response.body) throw new Error('Response stream is not readable');

    const {message, role} = await this._processStream(response.body, onChunk);

    if (message.trim()) {
      this._messages.push({role, content: message});
    }

    return {role, content: message};
  }

  /**
   * Constructs the request body for the chat API.
   */
  private _buildRequestBody(): object {
    return {
      model: environments.model,
      messages: this._messages,
      stream: true
    };
  }

  /**
   * Sends a POST request to the configured API endpoint.
   *
   * @param body Request payload
   */
  private async _sendRequest(body: object): Promise<Response> {
    return fetch(environments.ollamaUrl, {
      method: HttpMethodEnum.post,
      headers: this._headers,
      body: JSON.stringify(body)
    });
  }

  /**
   * Processes the response stream and invokes the chunk callback for each message.
   *
   * @param stream Readable stream from the API
   * @param onChunk Callback for each message part
   */
  private async _processStream(
    stream: ReadableStream<Uint8Array>,
    onChunk: (message: ChatMessage) => void
  ): Promise<{ message: string; role: string }> {
    const reader = stream.getReader();
    const decoder = new TextDecoder(this._textDecoder);
    let fullMessage = '';
    let role = this._defaultRole;

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, {stream: true});
      this._parseChunk(chunk, onChunk, (content, detectedRole) => {
        role = <RoleEnum>detectedRole || role;
        fullMessage += content;
      });
    }

    return {message: fullMessage, role};
  }

  /**
   * Parses a single chunk and invokes the callback for each parsed line.
   *
   * @param chunk The raw decoded string chunk
   * @param onChunk The chunk callback to notify UI
   * @param onParsed Optional handler for parsed values (internal use)
   */
  private _parseChunk(
    chunk: string,
    onChunk: (message: ChatMessage) => void,
    onParsed?: (content: string, role?: string) => void
  ): void {
    for (const line of chunk.split(this._newlineDelimiter)) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        const content = parsed.message?.content || '';
        const role = parsed.message?.role;
        onChunk({role, content});
        if (onParsed) onParsed(content, role);
      } catch (err) {
        console.warn(this._parsingErrorMessage, err, line);
      }
    }
  }
}
