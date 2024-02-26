import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig | any = {
  providers: [provideHttpClient(), provideRouter(routes)],
  api: 'http://localhost:3000',
};
