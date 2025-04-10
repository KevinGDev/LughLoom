import {Component} from '@angular/core';
import {HomeComponent} from '../home/home.component';


@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [HomeComponent,]
})
export class AppComponent {
}
