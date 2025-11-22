import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AsyncPipe, NgClass} from '@angular/common';
import {backgrounds} from '../../utils/BackgroundEnum';
import {ChatComponent} from './chat/chat.component';
import {SimpleBackgroundInterface} from '../../interfaces/simpleBackgroundInterface';
import {BackgroundInterface} from '../../interfaces/backgroundInterface';
import {SimpleCharacterInterface} from '../../interfaces/simpleCharacterInterface';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {LughDiceComponent} from './lughdice/lughdice.component';
import {OllamaService} from '../../services/ollama-api.service';
import {Prompts} from '../../utils/Prompts';
import {ChatMessage} from '../../interfaces/chatMessageInterface';
import {DisplayMessage} from '../../interfaces/displayMessage';
import {MarkdownComponent} from 'ngx-markdown';
import {BehaviorSubject} from 'rxjs';


@Component({
  selector: 'app-story',
  imports: [
    FormsModule,
    NgClass,
    ChatComponent,
    TranslatePipe,
    LughDiceComponent,
    MarkdownComponent,
    AsyncPipe
  ],
  templateUrl: './story.component.html',
  standalone: true,
  styleUrls: ['./story.component.scss']
})
export class StoryComponent {
  @ViewChild('d20') private d20!: LughDiceComponent;

  constructor(private readonly ollamaService: OllamaService, private readonly translateService: TranslateService, private cdr: ChangeDetectorRef) {
  }

  characterCreated: boolean = false;
  simpleBackground: SimpleBackgroundInterface = {} as SimpleBackgroundInterface;
  character: SimpleCharacterInterface = {} as SimpleCharacterInterface;
  backgrounds = backgrounds;
  attributesList: string[] = ["name", "background", "omen"];
  currentAttributeIndex: number = 0;
  currentAttributeValue: string = '';
  conversationSubject = new BehaviorSubject<DisplayMessage[]>([]);
  conversation$ = this.conversationSubject.asObservable();
  fadeDice = false;
  isOmenPending = false;
  private omenBuffer: string = '';
  private omenReadyToDisplay = false;
  private omenPendingTimeout: ReturnType<typeof setTimeout> | null = null;
  isDiceDisabled: boolean = false;

  get currentAttribute(): string {
    return this.attributesList[this.currentAttributeIndex];
  }

  /**
   *
   * @param attributeValue is currently used only for name
   * but opened to extension and modification if it's needed to add others attributes for character creation
   */
  setCharacterAttribute(attributeValue: string) {
    this.character.name = attributeValue
    this.nextAttribute();
  }


  private nextAttribute() {
    if (this.currentAttributeIndex < this.attributesList.length - 1) {
      this.currentAttributeIndex++;
      this.currentAttributeValue = ''
    } else {
      this.characterCreated = true;
    }
  }

  selectBackground(background: BackgroundInterface): void {
    this.simpleBackground.label = background.labelKey;
    this.simpleBackground.description = background.descriptionKey;
    this.character.background = this.simpleBackground;
    this.nextAttribute();
  }

  triggerDiceRoll(): void {
    if(!this.isDiceDisabled) {
      const language = this.translateService.currentLang || this.translateService.defaultLang;
      this.isOmenPending = true;

      // Effacer buffer avant chaque tirage
      this.omenBuffer = '';
      this.omenReadyToDisplay = false;

      // Lancer le countdown 20s
      const MIN_DELAY = 100;
      const delayPromise = new Promise(resolve => {
        this.omenPendingTimeout = setTimeout(() => {
          this.omenReadyToDisplay = true;
          resolve(true);
        }, MIN_DELAY);
      });

      this.d20.rollWithPseudo3DRotation().then((diceResult) => {
        this.isDiceDisabled = true;
        const omenPrompt = Prompts.getOmenPrompt(diceResult, language);

        // --- Ajouter le message vide dans le UI ---
        const current = this.conversationSubject.getValue();
        const newMessage: DisplayMessage = {role: 'assistant', content: '', displayedLength: 0};
        const updated = [...current, newMessage];
        this.conversationSubject.next(updated);
        const index = updated.length - 1;

        // STREAM du texte
        const streamPromise = this.ollamaService.generateChatStream(omenPrompt, (chunk: ChatMessage) => {

          this.omenBuffer += chunk.content || '';

          // Si 20s pas encore écoulées -> NE PAS afficher
          if (!this.omenReadyToDisplay) return;

          this.updateOmenStream(index);

        });

        // Attendre STREAM + délai
        Promise.all([delayPromise, streamPromise]).then(() => {
          this.isOmenPending = false;
          this.fadeDice = true;
          // Forcer affichage complet quand tout est prêt
          this.updateOmenStream(index);

          // Switch to next step after some time
          setTimeout(() => {
            this.nextAttribute();
          }, 100);
        });
      });
    }
  }

  private updateOmenStream(index: number): void {
    const messages = this.conversationSubject.getValue();

    const updatedMessage: DisplayMessage = {
      ...messages[index],
      content: this.omenBuffer,
      displayedLength: this.omenBuffer.length
    };

    const newConversation = [...messages];
    newConversation[index] = updatedMessage;

    this.conversationSubject.next(newConversation);
    this.cdr.detectChanges();
  }

}
