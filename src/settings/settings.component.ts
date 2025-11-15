import {Component} from '@angular/core';
import {AppConfigService} from '../services/app-config.service';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    NgOptimizedImage
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  config: any; // ou UserConfig si typé

  constructor(private configService: AppConfigService, private router: Router) {
    this.config = this.configService.getConfig();
  }

  save() {
    this.configService.updateConfig(this.config);
    alert('Configuration saved!');
  }

  protected backToHome() {
    this.router.navigate(['']);
  }
}
