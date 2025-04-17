import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {backgrounds} from '../utils/BackgroundEnum';
import {ChatComponent} from './chat/chat.component';
import {SimpleBackgroundInterface} from '../interfaces/simpleBackgroundInterface';
import {BackgroundInterface} from '../interfaces/backgroundInterface';
import {SimpleCharacterInterface} from '../interfaces/simpleCharacterInterface';


@Component({
  selector: 'app-story',
  imports: [
    FormsModule,
    NgClass,
    ChatComponent
  ],
  templateUrl: './story.component.html',
  standalone: true,
  styleUrls: ['./story.component.scss']
})
export class StoryComponent {

  characterCreated: boolean = false;
  simpleBackground: SimpleBackgroundInterface = {} as SimpleBackgroundInterface;
  character: SimpleCharacterInterface = {} as SimpleCharacterInterface;
  backgrounds = backgrounds;
  attributesList: string[] = ["name", "background"];
  currentAttributeIndex: number = 0;
  currentAttributeValue: string = '';


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
    this.simpleBackground.label = background.label;
    this.simpleBackground.description = background.description;
    this.character.background = this.simpleBackground;
    this.nextAttribute();
  }

}
