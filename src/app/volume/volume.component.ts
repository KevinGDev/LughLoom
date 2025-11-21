import {Component} from '@angular/core';
import {AudioService} from '../../services/audio.service';
import {FormsModule} from '@angular/forms';
import {DecimalPipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-volume',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TranslatePipe],
  templateUrl: './volume.component.html',
  styleUrls: ['./volume.component.scss']
})
export class VolumeComponent {
  constructor(public audio: AudioService) {
  }

  onSliderMusicChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.audio.setMusicVolume(value);
  }

  onSliderSfxChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.audio.setSfxVolume(value);
  }
}
