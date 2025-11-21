import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {FormsModule} from "@angular/forms";
import {NgClass} from '@angular/common';
import {OllamaService} from '../../../services/ollama-api.service';
import {Prompts} from '../../../utils/Prompts';
import {RoleEnum} from '../../../utils/RoleEnum';
import {SimpleCharacterInterface} from '../../../interfaces/simpleCharacterInterface';
import {MarkdownComponent} from 'ngx-markdown';
import {Language} from '../../../utils/LanguagesEnum';
import {ChatMessage} from '../../../interfaces/chatMessageInterface';
import {ErrorMessages} from '../../../utils/ErrorMessages';
import {LughDiceComponent} from '../lughdice/lughdice.component';

interface DisplayMessage extends ChatMessage {
  displayedLength?: number; // Longueur déjà affichée sans animation
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgClass, MarkdownComponent, LughDiceComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly translateService: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  @Input() character: SimpleCharacterInterface | null = null;
  @ViewChild("chatContainer") private chatContainer!: ElementRef;

  choices: string[] = [];
  rules: string = "";
  answer: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;
  conversation: DisplayMessage[] = [];
  downloading: boolean = false;
  language: string = '';
  dice: boolean = true;

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.language = this.translateService.currentLang || this.translateService.defaultLang;
    await this.startStory();
  }

  async startStory(): Promise<void> {
    this.isTyping = true;
    this.rules = Prompts.darkFantasyMaster(this.character, this.getLanguageFullValue(this.language));

    try {
      this.conversation.push({
        role: RoleEnum.assistant,
        content: '',
        displayedLength: 0
      });

      await this.ollamaService.generateChatStream(this.rules, (chunk: ChatMessage) => {
        const lastIndex = this.conversation.length - 1;
        const lastMessage = this.conversation[lastIndex];

        // Mettre à jour displayedLength AVANT d'ajouter le nouveau contenu
        lastMessage.displayedLength = lastMessage.content.length;
        lastMessage.content += chunk.content;

        this.cdr.detectChanges();
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
    if (!this.answer.trim()) return;

    this.isTyping = true;
    this.isLoading = true;

    const playerChatMessage: DisplayMessage = {role: RoleEnum.user, content: this.answer};
    this.conversation.push(playerChatMessage);

    const userInput = this.answer;
    this.answer = '';
    this.choices = [];

    this.conversation.push({
      role: RoleEnum.assistant,
      content: '',
      displayedLength: 0
    });

    try {
      await this.ollamaService.generateChatStream(userInput, (chunk: ChatMessage) => {
        const lastIndex = this.conversation.length - 1;
        const lastMessage = this.conversation[lastIndex];

        lastMessage.displayedLength = lastMessage.content.length;
        lastMessage.content += chunk.content;

        this.cdr.detectChanges();
        this.scrollToBottom();
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


  getDisplayedContent(message: DisplayMessage): string {
    return message.content.substring(0, message.displayedLength || 0);
  }

  getNewContent(message: DisplayMessage): string {
    return message.content.substring(message.displayedLength || 0);
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

  async summarizeAndDownload(): Promise<void> {
    this.downloading = true;
    const fullConversation = this.conversation
      .map(msg => `${msg.role === RoleEnum.user ? 'Player' : 'MJ'} : ${msg.content}`)
      .join('\n');
    const prompt = Prompts.getSummarizePrompt(fullConversation);
    this.isLoading = true;

    let summary = '';
    try {
      await this.ollamaService.generateChatStream(prompt, (chunk: ChatMessage) => {
        summary += chunk.content;
      });

      const dataStr = JSON.stringify({
        summary,
        conversation: this.conversation
      }, null, 2);

      const blob = new Blob([dataStr], {type: 'application/json'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'conversation-summary.json';
      a.click();
      window.URL.revokeObjectURL(url);

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
    } catch {
    }
  }
}
