import {Component} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Router, RouterLink} from '@angular/router';
import {StoryComponent} from '../story/story.component';
import {appConfig} from '../app/app.config';
import {SettingsComponent} from '../settings/settings.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe, StoryComponent, SettingsComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  protected selectedContent: string = 'home';

  constructor(private translate: TranslateService, private router: Router) {
  }

  translateText(lang: string) {
    this.translate.use(lang);
  }

  goToAbout() {
    this.router.navigate(['/about']);
  }

  startAdventure() {
    this.selectedContent = 'story';
    document.body.classList.add('scrolled');
    const audio = new Audio('assets/bell.mp3');
    audio.volume = 0.5; // optionnel
    audio.play();
  }

}
