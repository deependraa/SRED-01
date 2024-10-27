import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Your routes

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [provideHttpClient(), provideRouter(routes)], 
}).catch((err) => console.error(err));
