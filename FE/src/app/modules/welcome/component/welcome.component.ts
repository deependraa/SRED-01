import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [NgIf, AgGridAngular],
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
      </div>
      <button *ngIf="showRemove" class="remove-button" (click)="removeAuth()">
        Remove
        <img
          src="https://img.icons8.com/?size=100&id=Mhl1TfJLdkh5&format=png&color=000000"
          alt="GitHub Logo"
          class="github-logo"
        />
      </button>

      <!-- AG Grid Table for Repositories -->
      <ag-grid-angular
        class="ag-theme-alpine"
        style="width: 100%; height: 400px;"
        [rowData]="rowData"
        [columnDefs]="columnDefs"
        [defaultColDef]="defaultColDef"
        (cellValueChanged)="onIncludeChange($event)"
      ></ag-grid-angular>

      <!-- AG Grid Table for Detailed Data -->
      <ag-grid-angular
        class="ag-theme-alpine"
        style="width: 100%; height: 400px; margin-top: 40px;"
        [rowData]="detailRowData"
        [columnDefs]="detailColumnDefs"
        [defaultColDef]="defaultColDef"
      ></ag-grid-angular>
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WelcomeComponent implements OnInit {
  name!: string;
  username!: string;
  photo!: string;
  email!: string;
  token!: string;
  lastSynced: string = 'Today';
  showRemove: boolean = false;
  rowData: any[] = [];
  detailRowData: any[] = [];

  columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Repo Name' },
    { field: 'org', headerName: 'Organization' },
    { field: 'clone_url', headerName: 'URL' },
    {
      field: 'included',
      headerName: 'Included',
      checkboxSelection: false,
      editable: true,
    },
  ];

  detailColumnDefs: ColDef[] = [
    { field: 'user', headerName: 'User' },
    { field: 'userName', headerName: 'User Name' },
    { field: 'totalCommits', headerName: 'Total Commits' },
    { field: 'totalPullRequests', headerName: 'Total Pull Requests' },
    { field: 'totalIssues', headerName: 'Total Issues' },
  ];

  defaultColDef = {
    sortable: true,
    filter: true,
    checkboxSelection: false,
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.name = user.name;
      this.username = user.username;
      this.photo = user.photo;
      this.email = user.email;
      this.token = user.token;
      this.fetchOrganizationsAndRepos();
      this.fetchDetailedDataForIncludedRepos();
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
      console.error('No token found in localStorage.');
    }
  }

  fetchOrganizationsAndRepos() {
    if (this.token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.token}`,
      });

      this.http
        .get('http://localhost:3000/users/organizations-and-repos', { headers })
        .subscribe(
          (data: any) => {
            this.rowData = data.repos.map((repo: any) => ({
              id: repo.repoId,
              name: repo.name,
              org: repo.organization,
              clone_url: repo.url,
              included: repo.included,
            }));

            this.cdr.detectChanges();
          },
          (error) =>
            console.error(
              'Error fetching organizations and repositories:',
              error
            )
        );
    }
  }

  fetchDetailedDataForIncludedRepos() {
    if (this.token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.token}`,
      });

      this.http
        .get('http://localhost:3000/users/repos/included-details', { headers })
        .subscribe(
          (data: any) => {
            this.detailRowData = data.map((detail: any) => ({
              user: detail.user,
              userName: detail?.commits?.user?.login,
              totalCommits: detail.commits.length,
              totalPullRequests: detail.pullRequests.length,
              totalIssues: detail.issues.length,
            }));
            this.cdr.detectChanges();
          },
          (error) =>
            console.error(
              'Error fetching detailed data for included repos:',
              error
            )
        );
    }
  }

  onIncludeChange(event: any) {
    const updatedRepo = event.data;
    if (updatedRepo.included) {
      this.addRepoToInclude(updatedRepo);
    } else {
      this.removeRepoFromInclude(updatedRepo);
    }
  }

  addRepoToInclude(repo: any) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });

    this.http
      .post(
        `http://localhost:3000/users/repos/${repo.id}/include`,
        {},
        { headers }
      )
      .subscribe(
        (data: any) => {
          this.fetchDetailedDataForIncludedRepos();
        },
        (error) => console.error('Error including repository:', error)
      );
  }

  removeRepoFromInclude(repo: any) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });

    this.http
      .delete(`http://localhost:3000/users/repos/${repo.id}/remove`, {
        headers,
      })
      .subscribe(
        (data: any) => {
          this.fetchDetailedDataForIncludedRepos();
        },
        (error) => console.error('Error removing repository:', error)
      );
  }
}
