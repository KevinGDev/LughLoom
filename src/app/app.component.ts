import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';


@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  backgrounds = [
    'assets/backgrounds/background1.png',
    // 'assets/backgrounds/background2.png',
  ];

  randomBg = '';

  ngOnInit() {
    const index = Math.floor(Math.random() * this.backgrounds.length);
    this.randomBg = this.backgrounds[index];
    document.body.style.backgroundImage = `url(${this.randomBg})`;
  }
}
