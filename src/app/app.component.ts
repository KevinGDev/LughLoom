import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';


declare global {
  interface Window {
    electronAPI: {
      sendMessage:
        (message: string) => void;
    }
  }
}

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [RouterOutlet]
})
export class AppComponent {
  sendMessage() {
    window.electronAPI.sendMessage("Hello from Angular!");
  }

}
