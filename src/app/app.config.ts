import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  FacebookLoginProvider,
  SocialAuthServiceConfig,
} from '@abacritt/angularx-social-login';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig | any = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider('clientId'),
          },
        ],
        onError: (err) => {
          console.error(err);
        },
      } as SocialAuthServiceConfig,
    },
  ],
  api: 'http://localhost:3000',
};
