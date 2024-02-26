import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

import { HttpClient } from '@angular/common/http';

import { appConfig } from './app.config';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GoogleSigninButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  user: any;
  loggedIn: boolean = false;
  accessToken: string = '';
  logoutTimer: number = 5;
  loginBtn: HTMLDivElement;
  client_id: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(appConfig.api + '/appsettings').subscribe((res: any) => {
      appConfig.client_id = res.client_id;
      this.InitGoogleSignIn();
      this.renderGoogleSignIn();
    });
    this.loginBtn = document.getElementById('buttonDiv') as HTMLDivElement;
  }

  async handleCredentialResponse(response: any) {
    this.http
      .post('http://localhost:3000/login/google', {
        code: response.credential,
      })
      .subscribe((res: any) => {
        if (!res.error) {
          this.loggedIn = true;
          this.user = res;
          this.loginBtn.innerHTML = '';
          return;
        }

        this.loggedIn = false;
        this.user = null;
        this.renderGoogleSignIn();
        console.log(res.error);
      });
  }

  InitGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: appConfig.client_id,
      callback: this.handleCredentialResponse.bind(this),
    });
  }

  renderGoogleSignIn() {
    google.accounts.id.renderButton(this.loginBtn, {
      theme: 'filled_black',
      size: 'medium',
      text: 'signin',
    });
  }
}
