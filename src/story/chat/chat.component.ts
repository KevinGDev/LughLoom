import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { FormsModule } from "@angular/forms";
import { NgClass } from '@angular/common';
import { OllamaService } from '../../services/ollama-api.service';
import { Prompts } from '../../utils/Prompts';
import { RoleEnum } from '../../utils/RoleEnum';
import { SimpleCharacterInterface } from '../../interfaces/simpleCharacterInterface';
import { MarkdownComponent } from 'ngx-markdown';
import { Language } from '../../utils/LanguagesEnum';
import { ChatMessage } from '../../interfaces/chatMessageInterface';
import { ErrorMessages } from '../../utils/ErrorMessages';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgClass, MarkdownComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly translateService: TranslateService
  ) {}

  @Input() character: SimpleCharacterInterface | null = null;
  @ViewChild("chatContainer") private chatContainer!: ElementRef;

  choices: string[] = [];
  rules: string = "";
  answer: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;
  conversation: ChatMessage[] = [];
  downloading: boolean = false;
  language: string = '';

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.language = this.translateService.currentLang || this.translateService.defaultLang;
    await this.startStory();
  }

  async startStory(): Promise<void> {
    this.isTyping = true;

    this.rules = Prompts.darkFantasyMaster(this.character, this.getLanguageFullValue(this.language));
    try {
      await this.ollamaService.generateChatStream(this.rules, (message: ChatMessage) => {
        this.pushOrUpdateAssistantChatMessage(message);
        this.scrollToBottom();
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.isTyping = false;
      this.isLoading = false;

      const lastMessage = this.conversation[this.conversation.length - 1];
      if (lastMessage && lastMessage.role !== RoleEnum.user) {
        this.extractStoryAndChoices(lastMessage.content);
      }
    }
  }

  getLanguageFullValue(language: string): string {
    return Language[language as keyof typeof Language];
  }

  async handleKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Enter') {
      event.preventDefault();
      await this.sendAnswer();
    }
  }

  async sendAnswer(): Promise<void> {
    this.isTyping = true;
    if (!this.answer.trim()) return;

    this.isLoading = true;
    const playerChatMessage: ChatMessage = { role: 'user', content: this.answer };
    this.conversation.push(playerChatMessage);

    this.choices = [];

    try {
      await this.ollamaService.generateChatStream(this.answer, (message: ChatMessage) => {
        this.answer = '';
        this.pushOrUpdateAssistantChatMessage(message);
      });
    } catch (error) {
      console.error(ErrorMessages.streamingError, error);
    } finally {
      this.isTyping = false;
      this.isLoading = false;
      const lastMessage = this.conversation[this.conversation.length - 1];
      if (lastMessage && lastMessage.role !== RoleEnum.user) {
        this.extractStoryAndChoices(lastMessage.content);
      }
    }
  }

  private extractStoryAndChoices(text: string) {
    text = text.replace(/\r/g, '').trim();
    const choiceMatches = text.match(/(\d+\s*-[^\n]+)/g);
    this.choices = choiceMatches
      ? choiceMatches.map(c => c.replace(/^\d+\s*-\s*/, '').trim())
      : [];
  }

  clickChoice(choice: string): void {
    this.answer = choice;
    this.sendAnswer().then();
  }

  private pushOrUpdateAssistantChatMessage(message: ChatMessage): void {
    if (
      this.conversation.length > 0 &&
      this.conversation[this.conversation.length - 1].role === message.role &&
      message.role !== RoleEnum.user
    ) {
      this.conversation[this.conversation.length - 1].content += message.content;
    } else {
      this.conversation.push({ role: message.role, content: message.content });
    }
    this.scrollToBottom();
  }

  downloadConversation(): void {
    const dataStr = JSON.stringify(this.conversation, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation.json';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  async summarizeAndDownload(): Promise<void> {
    this.downloading = true;
    const fullConversation = this.conversation
      .map(msg => `${msg.role === RoleEnum.user ? 'Player' : 'MJ'} : ${msg.content}`)
      .join('\n');
    const prompt = Prompts.getSummarizePrompt(fullConversation);
    this.isLoading = true;
    let summary = '';
    try {
      await this.ollamaService.generateChatStream(prompt, (message: ChatMessage) => {
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

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scroll({
        top: this.chatContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    } catch {}
  }
}
