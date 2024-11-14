import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="card">
      <div class="card-header">
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="GitHub Logo"
          class="github-logo"
        />
        <span class="platform-name">GitHub</span>
      </div>
      <div class="card-body">
        <button class="connect-button" (click)="connectToGithub()">
          Connect
        </button>
        <p class="connect-text">Connect Sredio to GitHub</p>
      </div>
    </div>
  `,
  styleUrls: ['../home.component.css'],
})
export class HomeComponent {
  connectToGithub() {
    window.location.href = 'http://localhost:3000/auth/github';
  }
}
