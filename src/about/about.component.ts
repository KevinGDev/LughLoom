import {AfterViewInit, Component, ElementRef, inject, ViewChild} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    TranslatePipe,
    NgOptimizedImage
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements AfterViewInit {
  @ViewChild('aboutTextElement') aboutTextElement!: ElementRef;
  translate: TranslateService = inject(TranslateService);


  constructor(private router: Router) {
  }

  ngAfterViewInit() {
    const text = this.translate.instant('aboutText');
    this.typeWriterEffect(text);
  }

  typeWriterEffect(text: string) {
    let index = 0;
    this.aboutTextElement.nativeElement.innerHTML = '';
    const interval = setInterval(() => {
      if (index < text.length) {
        this.aboutTextElement.nativeElement.innerHTML += text.charAt(index);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 10);
  }

  protected backToHome() {
    this.router.navigate(['']).then()
  }
}
