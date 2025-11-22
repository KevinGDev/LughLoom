import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class AudioService {
  private _musicVolume = 0.2;
  private _sfxVolume = 1.0; // Effets sonores forts par défaut

  private audioFiles = [
    'assets/musics/track1.mp3',
    'assets/musics/track2.mp3',
    'assets/musics/track3.mp3',
    'assets/musics/track4.mp3',
    'assets/musics/track5.mp3',
    'assets/musics/track6.mp3'
  ];
  private randomIndex = Math.floor(Math.random() * this.audioFiles.length);

  music = new Audio(this.audioFiles[this.randomIndex]);

  constructor() {
    this.music.loop = true;
    this.music.volume = this._musicVolume;
    this.music.play().catch(() => {
    });
  }

  /** Controls music volume (slider) */
  setMusicVolume(v: number) {
    this._musicVolume = v;
    this.music.volume = v;
    localStorage.setItem('musicVolume', v.toString());
  }

  get musicVolume() {
    return this._musicVolume;
  }

  /** Controls sfx volume (slider) */
  setSfxVolume(v: number) {
    this._sfxVolume = v;
    localStorage.setItem('sfxVolume', v.toString());
  }

  /** Play sound effects with independent scaling */
  playSfx(path: string) {
    const sfx = new Audio(path);
    sfx.volume = this._sfxVolume * this._musicVolume; // audible but respects global volume
    sfx.play();
  }

  get sfxVolume() {
    return this._sfxVolume;
  }
}

