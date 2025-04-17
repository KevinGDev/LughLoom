import {Component, Input, OnInit} from '@angular/core';
import {TranslatePipe} from "@ngx-translate/core";
import {FormsModule} from "@angular/forms";
import {NgClass} from '@angular/common';
import {OllamaService} from '../../services/ollama-api.service';
import {Prompts} from '../../utils/Prompts';
import {RoleEnum} from '../../utils/RoleEnum';
import {ErrorMessages} from '../../utils/ErrorMessages';
import {SimpleCharacterInterface} from '../../interfaces/simpleCharacterInterface';

interface Message {
  role: string;
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgClass],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {

  constructor(
    private readonly ollamaService: OllamaService,
  ) {
  }

  @Input() character: SimpleCharacterInterface | null = null;
  rules: string = "";
  answer: string = '';
  isLoading: boolean = false;

  conversation: Message[] = [];
  downloading: boolean = false;

  /**
   * Initializes the component, loading the story at the start.
   * This function will be called when the component is initialized.
   */
  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    await this.startStory();
  }

  /**
   * Starts the story by sending the initial prompt to the Ollama service
   * and processing the response in a chat stream.
   *
   * @throws Error if there's an issue while processing the stream.
   */
  async startStory() {
    this.rules = Prompts.darkFantasyMaster(this.character)
    try {
      await this.ollamaService.generateChatStream(this.rules, (message: Message) => {
        this.pushOrUpdateAssistantMessage(message);
      });

    } catch (error) {
      console.log(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handles the key down event for the Enter key. When Enter is pressed,
   * it sends the user's input as a message to the server.
   *
   * @param event The keyboard event triggered when the user presses a key.
   */
  async handleKeyDown(event: KeyboardEvent) {
    let enter = 'Enter';
    if (event.key === enter) {
      event.preventDefault();
      await this.sendAnswer();
    }
  }

  /**
   * Sends the user's answer as a message to the Ollama service for streaming.
   * It will push the player's message to the conversation and update the assistant's reply.
   *
   * @throws Error if there's an issue while generating the chat stream.
   */
  async sendAnswer(): Promise<void> {
    if (!this.answer.trim()) return;

    this.isLoading = true;
    const playerMessage: Message = {role: 'user', content: this.answer};
    this.conversation.push(playerMessage);

    try {
      await this.ollamaService.generateChatStream(this.answer, (message: Message) => {
        this.answer = '';
        this.pushOrUpdateAssistantMessage(message);
      });
    } catch (error) {
      console.error(ErrorMessages.streamingError, error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Pushes or updates the assistant's message in the conversation.
   * If the last message from the assistant is the same role, it will append
   * the new content to it. Otherwise, a new message is pushed.
   *
   * @param message The message from the assistant to be added or updated.
   */
  private pushOrUpdateAssistantMessage(message: Message) {
    if (
      this.conversation.length > 0 &&
      this.conversation[this.conversation.length - 1].role === message.role &&
      message.role !== RoleEnum.user
    ) {
      this.conversation[this.conversation.length - 1].content += message.content;
    } else {
      this.conversation.push({role: message.role, content: message.content});
    }
  }

  /**
   * Downloads the current conversation as a JSON file.
   * The conversation is converted to a JSON string, then a Blob is created to
   * allow the user to download the file.
   */
  downloadConversation(): void {
    const dataStr = JSON.stringify(this.conversation, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation.json';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  /**
   * Summarizes the entire conversation and triggers the download of the conversation.
   * The summary is generated using a custom prompt, and the result is appended
   * to the conversation before triggering the download.
   *
   * @throws Error if there's an issue with the summarization or download.
   */
  async summarizeAndDownload(): Promise<void> {
    this.downloading = true;
    const fullConversation = this.conversation
      .map(msg => `${msg.role === RoleEnum.user ? 'Player' : 'MJ'} : ${msg.content}`)
      .join('\n');

    const prompt = Prompts.getSummarizePrompt(fullConversation);
    this.isLoading = true;
    let summary = '';
    try {
      await this.ollamaService.generateChatStream(prompt, (message: Message) => {
        summary += message.content;
      });
      this.downloadConversation();
    } catch (error) {
      console.error(ErrorMessages.downloadError, error);
    } finally {
      this.isLoading = false;
      this.downloading = false;
    }
  }
}
