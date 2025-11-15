import {Routes} from '@angular/router';
import {AboutComponent} from '../about/about.component';
import {HomeComponent} from '../home/home/home.component';

export const routes: Routes = [
  {path: 'about', component: AboutComponent},
  {path: '', component: HomeComponent},
];
