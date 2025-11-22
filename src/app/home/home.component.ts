import {Component} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {StoryComponent} from '../story/story.component';
import {SettingsComponent} from '../settings/settings.component';
import {AudioService} from '../../services/audio.service';
import {AboutComponent} from '../about/about.component';
import {NavigationService} from '../../services/navigation-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe, StoryComponent, SettingsComponent, AboutComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private translate: TranslateService, private audioService: AudioService, public navigationService: NavigationService) {
  }


  translateText(lang: string) {
    this.translate.use(lang);
  }

  scrolled = false;
  locked = false;

  navigate(page: string) {
    this.navigationService.navigate(page);

    if (page === 'story' && !this.locked) {
      this.scrolled = true;
      this.audioService.playSfx('/assets/sfx/bell.mp3');

      setTimeout(() => {
        this.locked = true;
      }, 1000); // correspond à la transition CSS
    }

  }
}
