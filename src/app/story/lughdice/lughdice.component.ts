import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {AudioService} from '../../../services/audio.service';

@Component({
  selector: 'lughdice',
  templateUrl: './lughdice.component.html',
  styleUrls: ['./lughdice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LughDiceComponent implements AfterViewInit {
  /** taille en px (largeur = hauteur) */
  @Input() size = 200;

  /** valeur affichée (1..20) */
  @Input() value: number | null = null;

  /** si true, affiche le raster fallback (non utilisé par défaut) */
  @Input() useRaster = false;

  @ViewChild('valueText', {static: true}) valueText!: ElementRef<SVGTextElement>;
  @ViewChild('container', {static: true}) container!: ElementRef<HTMLDivElement>;
  @Input() disabled!: boolean;

  constructor(private renderer: Renderer2, private audioService: AudioService) {
  }

  private result: number = 0;

  ngAfterViewInit(): void {

    if (this.value === null) this.value = 20;
    this.setValue(this.value);
    // appliquer la taille sur le container
    this.renderer.setStyle(this.container.nativeElement, 'width', `${this.size}px`);
    this.renderer.setStyle(this.container.nativeElement, 'height', `${this.size}px`);
  }

  /** Définit la valeur affichée (sans animation) */
  setValue(n: number) {
    const el = this.valueText?.nativeElement;
    if (el) el.textContent = String(n);
  }

  rollWithPseudo3DRotation(): Promise<number> {
    return new Promise<number>(resolve => {

      // Cas : dé désactivé → retour immédiat sans animation
      if (this.disabled) {
        resolve(this.result ?? 0);
        return;
      }

      // Sinon → lancer normal
      this.result = Math.floor(Math.random() * 20) + 1;

      const duration = 300;
      const mid = Math.floor(duration * 0.52);

      this.audioService.playSfx("/assets/sfx/dice.mp3");

      const el = this.container.nativeElement;

      this.renderer.setStyle(el, '--roll-duration', `${duration}ms`);
      this.renderer.setAttribute(el, 'aria-busy', 'true');
      this.renderer.addClass(el, 'pseudo-3d-roll');

      const midTimer = setTimeout(() => this.setValue(this.result), mid);

      setTimeout(() => {
        this.renderer.removeClass(el, 'pseudo-3d-roll');
        clearTimeout(midTimer);

        resolve(this.result);
      }, duration + 60);
    });
  }



}
