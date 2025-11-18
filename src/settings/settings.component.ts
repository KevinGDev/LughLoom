import {Component} from '@angular/core';
import {AppConfigService} from '../services/app-config.service';
import {FormsModule} from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {VolumeComponent} from '../volume/volume.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    NgOptimizedImage,
    VolumeComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  config: any;

  constructor(
    private configService: AppConfigService,
    private router: Router,
    private snackBar: MatSnackBar,
    private translateService: TranslateService,
  ) {
    this.config = this.configService.getConfig();
  }

  save() {
    this.configService.updateConfig(this.config);

    // 🟢 Snackbar à la place de alert()
    this.snackBar.open(this.translateService.instant('configSaved'), this.translateService.instant('close'), {
      duration: 3000, // durée en ms
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'snackbar'
    });
  }

  protected backToHome() {
    this.router.navigate(['']).then()
  }
}
