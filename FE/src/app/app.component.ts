import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterOutlet } from '@angular/router'; 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Github0Auth';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    // Check if the necessary user info is present in the query parameters
    this.activatedRoute.queryParams.subscribe((params) => {
      const name = params['name'];
      const username = params['username'];
      const photo = params['photo'];
      const email = params['email'];
      const id = params['id'];
      const token = params['token'];

      if (name && username && photo && email && id && token) {
        this.storeUserData(name, username, photo, email, id, token);
      }
    });
  }

  // Function to handle GitHub connect
  connectToGithub() {
    // Redirect to GitHub OAuth URL
    window.location.href = 'http://localhost:3000/auth/github';
  }

  // Function to store user data and redirect to dashboard
  storeUserData(
    name: string,
    username: string,
    photo: string,
    email: string,
    id: string,
    token: string
  ) {
    const userData = { name, username, photo, email, id, token };

    // Store the user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));

    // Redirect to the welcome page after storing user data
    this.router.navigate(['/welcome']);
  }
}
