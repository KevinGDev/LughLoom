import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[] = ['home'];

  navigate(page: string) {
    this.history.push(page);

  }

  back() {
    if (this.history.length > 1) {
      this.history.pop();
    }
    return this.current();
  }

  current() {
    return this.history[this.history.length - 1];
  }
}
