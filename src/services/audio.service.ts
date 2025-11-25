import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class AudioService {
  private _musicVolume = 0.1;
  private _sfxVolume = 1.0;

  private audioFiles = [
    './assets/musics/test.ogg',
    // './assets/musics/track1.mp3',
    // './assets/musics/track2.mp3',
    // './assets/musics/track3.mp3',
    // './assets/musics/track4.mp3',
    // './assets/musics/track5.mp3',
    // './assets/musics/track6.mp3',
    // './assets/musics/track7.mp3',
    // './assets/musics/track8.mp3',
  ];


  private music: HTMLAudioElement | null = null;

  constructor() {
    // Restaurer les volumes
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSfxVolume = localStorage.getItem('sfxVolume');

    if (savedMusicVolume) this._musicVolume = parseFloat(savedMusicVolume);
    if (savedSfxVolume) this._sfxVolume = parseFloat(savedSfxVolume);

    this.playRandomMusic();
  }

  private playRandomMusic() {
    const randomIndex = Math.floor(Math.random() * this.audioFiles.length);
    const track = this.audioFiles[randomIndex];

    console.log('🎵 Lecture de:', track);

    if (this.music) {
      this.music.pause();
      this.music.src = '';
    }

    this.music = new Audio(track);
    this.music.volume = this._musicVolume;

    this.music.onerror = (e) => {
      console.error('❌ Erreur:', track, e);
    };

    this.music.play().catch((error) => {
      console.error('❌ Erreur play:', error);
    });

    this.music.addEventListener('ended', () => {
      this.playRandomMusic();
    });
  }

  setMusicVolume(v: number) {
    this._musicVolume = v;
    if (this.music) this.music.volume = v;
    localStorage.setItem('musicVolume', v.toString());
  }

  get musicVolume() {
    return this._musicVolume;
  }

  setSfxVolume(v: number) {
    this._sfxVolume = v;
    localStorage.setItem('sfxVolume', v.toString());
  }

  playSfx(path: string) {
    const sfx = new Audio(path);
    sfx.volume = this._sfxVolume * this._musicVolume;
    sfx.play();
  }

  get sfxVolume() {
    return this._sfxVolume;
  }
}
