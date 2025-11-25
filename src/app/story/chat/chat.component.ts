import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {FormsModule} from "@angular/forms";
import {NgClass} from '@angular/common';
import {OllamaService} from '../../../services/ollama-api.service';
import {Prompts} from '../../../utils/Prompts';
import {RoleEnum} from '../../../utils/RoleEnum';
import {SimpleCharacterInterface} from '../../../interfaces/simpleCharacterInterface';
import {Language} from '../../../utils/LanguagesEnum';
import {ChatMessage} from '../../../interfaces/chatMessageInterface';
import {ErrorMessages} from '../../../utils/ErrorMessages';
import {LughDiceComponent} from '../lughdice/lughdice.component';
import {DisplayMessage} from '../../../interfaces/displayMessage';
import {MarkdownComponent} from 'ngx-markdown';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TranslatePipe, FormsModule, NgClass, LughDiceComponent, MarkdownComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  protected isStarting: boolean = true;
  protected textArea: boolean = true;
  protected fadeDice: boolean = false;

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly translateService: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {
  }

  @Input() character: SimpleCharacterInterface | null = null;
  @ViewChild("chatContainer") private chatContainer!: ElementRef;
  @ViewChild('d20') private d20!: LughDiceComponent;


  choices: string[] = [];
  rules: string = "";
  answer: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;
  conversation: DisplayMessage[] = [];
  downloading: boolean = false;
  language: string = '';
  dice: boolean = false;


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
        this.isStarting = false;
        // Mettre à jour displayedLength AVANT d'ajouter le nouveau contenu
        lastMessage.displayedLength = lastMessage.content.length;
        lastMessage.content += chunk.content;

        this.cdr.detectChanges();
        this.scrollToBottomSlowly();
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.manageEndOfConversation()
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
        this.scrollToBottomSlowly();
      });
    } catch (error) {
      console.error(ErrorMessages.streamingError, error);
    } finally {
      this.manageEndOfConversation();
    }
  }


  private manageEndOfConversation() {
    this.isTyping = false;
    this.isLoading = false;
    const lastMessage = this.conversation[this.conversation.length - 1];
    if (lastMessage && lastMessage.role !== RoleEnum.user) {
      if (this.detectDiceRollRequest(lastMessage.content)) {
        this.dice = true;
        this.textArea = false;
        lastMessage.content = lastMessage.content.replace(/<roll required:\s*1d20>/i, this.translateService.instant('throwDice')).trim();
      }
      this.extractStoryAndChoices(lastMessage.content);
    }
  }

  private extractStoryAndChoices(text: string) {
    text = text.replace(/\r/g, '').trim();
    const choiceMatches = text.match(/(?:^|\n)\s*(\d+\.?|\d+\)|\d+\s*[-–—])\s+(.+)/g);
    this.choices = choiceMatches
      ? choiceMatches.map(c => c.replace(/^\s*(\d+\.?|\d+\)|\d+\s*[-–—])\s*/, '').trim())
      : [];

  }

  clickChoice(choice: string): void {
    this.answer = choice;
    this.sendAnswer().then();
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

  private scrollFraction = 0; // propriété de la classe

  private scrollToBottomSlowly() {
    if (!this.chatContainer) return;
    const container = this.chatContainer.nativeElement;

    const step = () => {
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distance > 0.5) {
        // accumuler la fraction
        this.scrollFraction += 0.0015; // vitesse réelle souhaitée
        const move = Math.floor(this.scrollFraction);
        if (move > 0) {
          container.scrollTop += move;
          this.scrollFraction -= move;
        }
        requestAnimationFrame(step);
      } else {
        this.scrollFraction = 0; // reset à la fin
      }
    };

    requestAnimationFrame(step);
  }

  private detectDiceRollRequest(text: string): boolean {
    const rollPattern = /<roll required:\s*1d20>/i;
    return rollPattern.test(text);
    this.fadeDice = false;
  }

  public triggerDiceRoll(): void {
    if (this.d20 && this.dice) {
      this.d20.rollWithPseudo3DRotation().then((result) => {

        // 🆕 1) Ajouter un message visible dans la conversation
        const rollMessage: DisplayMessage = {
          role: RoleEnum.user,
          content: `🎲 **${this.translateService.instant('diceRoll') || 'Dice roll'}: ${result}**`
        };
        this.conversation.push(rollMessage);
        this.cdr.detectChanges();
        this.scrollToBottomSlowly();

        // 🆕 2) Utiliser le résultat comme réponse pour Ollama
        this.fadeDice = true;

        this.answer = result.toString();
        this.sendAnswer().then();

        // Garder l'état propre
        setTimeout(() => {
          this.dice = false;
          this.textArea = true;

        }, 3000);
      });
    }
  }

}

