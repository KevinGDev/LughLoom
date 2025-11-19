import {Component} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Router, RouterLink} from '@angular/router';
import {StoryComponent} from '../story/story.component';
import {SettingsComponent} from '../settings/settings.component';
import {AudioService} from '../../services/audio.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe, StoryComponent, SettingsComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  protected selectedContent: string = 'home';

  constructor(private translate: TranslateService, private router: Router, private audioService: AudioService) {
  }


  translateText(lang: string) {
    this.translate.use(lang);
  }

  startAdventure() {
    this.selectedContent = 'story';
    document.body.classList.add('scrolled');
    const audio = new Audio('assets/bell.mp3');
    this.audioService.playSfx('/assets/bell.mp3');
    audio.play();
  }

}
