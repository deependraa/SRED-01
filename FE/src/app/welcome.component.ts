import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common'; // Import NgIf directive

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [NgIf], // Add NgIf to the imports array
  template: `
    <div class="card">
      <div class="card-content">
        <div class="icon-section">
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub Logo"
            class="github-logo"
          />
          <span class="platform-name">GitHub</span>
          <span class="status-icon">&#x2705;</span>
          <!-- Green checkmark icon -->
        </div>
        <div class="sync-section">
          <div class="sync-info">
            <span>Admin :</span>
            <span>Last Synced : {{ lastSynced }}</span>
          </div>
          <div class="sync-type">
            <span>Sync Type: full</span>
          </div>
          <button class="dropdown-button" (click)="toggleRemoveButton()">
            &#x25BC;
          </button>
        </div>

        <!-- Dropdown button -->
      </div>

      <button *ngIf="showRemove" class="remove-button" (click)="removeAuth()">
        Remove
        <img
          src="https://img.icons8.com/?size=100&id=Mhl1TfJLdkh5&format=png&color=000000"
          alt="GitHub Logo"
          class="github-logo"
        />
      </button>
      <!-- Conditionally shown Remove button -->
    </div>
  `,
  styles: [
    `
      .card {
        position: relative;
        display: flex;
        flex-direction: column;
        padding: 15px;
        background-color: #f5f5f5;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 20px;
      }

      .card-content {
        display: flex;
        align-items: center;
        gap: 20px;
        width: 100%;
        justify-content: space-between;
      }

      .icon-section {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .github-logo {
        width: 24px;
        height: 24px;
      }

      .platform-name {
        font-weight: 500;
        color: #333;
      }

      .status-icon {
        font-size: 16px;
        color: green;
      }

      .sync-info {
        margin-left: auto;
        color: #666;
        font-size: 14px;
      }

      .sync-type {
        margin-left: 20px;
        color: #666;
        font-size: 14px;
      }

      .dropdown-button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        margin-left: auto;
        color: #666;
      }

      .remove-button {
        display: flex;

        align-self: flex-end;
        align-items: center;
        margin-top: 15px;
        padding: 10px 20px;
        background-color: #3f51b5;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      .sync-section {
        display: flex;
      }
    `,
  ],
})
export class WelcomeComponent implements OnInit {
  name!: string;
  username!: string;
  photo!: string;
  email!: string;
  token!: string;
  lastSynced: string = 'Today';
  showRemove: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.name = user.name;
      this.username = user.username;
      this.photo = user.photo;
      this.email = user.email;
      this.token = user.token;
    }
  }

  toggleRemoveButton() {
    this.showRemove = !this.showRemove;
  }

  removeAuth() {
    if (this.token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.token}`,
      });
      this.http
        .delete(`http://localhost:3000/auth/remove-auth`, { headers })
        .subscribe(
          (response) => {
            console.log('API response:', response);
            localStorage.removeItem('user');
            this.router.navigateByUrl('/');
          },
          (error) => {
            console.error('Error removing auth:', error);
          }
        );
    } else {
      console.error('No email found in localStorage.');
    }
  }
}
