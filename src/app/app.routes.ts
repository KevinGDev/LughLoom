import {Routes} from '@angular/router';
import {AboutComponent} from './about/about.component';
import {HomeComponent} from './home/home.component';
import {SettingsComponent} from './settings/settings.component';

export const routes: Routes = [
  {path: 'about', component: AboutComponent},
  {path: '', component: HomeComponent},
  {path: 'settings', component: SettingsComponent}
];
