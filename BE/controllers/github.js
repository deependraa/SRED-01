import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GithubStrategy } from "passport-github";
import User from "../models/userModel.js";
import { Octokit } from "octokit";
import * as dotenv from "dotenv";
import Repo from "../models/repoModel.js";
import Organization from "../models/organizationModel.js";
dotenv.config();

// Passport configuration settings for github routes and save the use in db
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GithubclientID,
      clientSecret: process.env.GithubclientSecret,
      callbackURL: "/auth/github/callback",
      scope: ["user", "read:org"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userdata = {
          name: profile.displayName,
          username: profile.username,
          email: profile._json.email || `${profile.username}@noemail.github.com`,
          photo: profile._json.avatar_url,
          accessToken
        };

        let user = await User.findOne({ username: userdata.username });

        if (user) {
          if (user.isUserDeleted) {
            console.log(`Reactivating user: ${user.username}`);
            user.isUserDeleted = false;
          }
          userdata._id = user._id;
          const token = jwt.sign(userdata, process.env.JwtSecret, {
            expiresIn: "24h",
          });
          user.token = token;
          await user.save();

          return done(null, user);
        }

        const token = jwt.sign(userdata, process.env.JwtSecret, {
          expiresIn: "24h",
        });

        user = await User.create({ ...userdata, token, isUserDeleted: false });
        userdata._id = user._id;
        userdata.token = jwt.sign(userdata, process.env.JwtSecret, { expiresIn: '24h' });
        user.token = userdata.token;
        return done(null, user);
      } catch (err) {
        console.error("Error in GitHubStrategy:", err);
        done(err);
      }
    }
  )
);



// Passport configuration settings for local login
passport.serializeUser((user, done) => {
  done(null, user.id);
});


// Passport configuration settings for local login
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) {
      console.error("Error deserializing user:", err);
      return done(err);
    }
    if (!user) {
      console.warn("User not found during deserialization");
    }
    done(null, user);
  });
});


// Save the user repositories in db
export const includeRepo = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;
  const accessToken = req.user.accessToken;
  const octokit = new Octokit({ auth: accessToken });

  try {
    const repo = await Repo.findOneAndUpdate(
      { repoId, userId },
      { included: true },
      { new: true }
    );

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    const [repoOwner, repoName] = repo.full_name.split("/");

    const [commits, pullRequests, issues] = await Promise.all([
      octokit.rest.repos.listCommits({
        owner: repoOwner,
        repo: repoName,
        per_page: 100,
      }),
      octokit.rest.pulls.list({
        owner: repoOwner,
        repo: repoName,
        state: "all",
        per_page: 100,
      }),
      octokit.rest.issues.listForRepo({
        owner: repoOwner,
        repo: repoName,
        state: "all",
        per_page: 100,
      }),
    ]);

    res.status(200).json({
      message: "Repository included successfully",
      repo,
      commits: commits.data,
      pullRequests: pullRequests.data,
      issues: issues.data,
    });
  } catch (error) {
    console.error("Error including repository:", error);
    res.status(500).json({ message: "Failed to include repository", error });
  }
};


// Remove the repository from db
export const removeRepo = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;

  try {
    const repo = await Repo.findOneAndUpdate(
      { repoId, userId },
      { included: false },
      { new: true }
    );

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    res.status(200).json({
      message: "Repository removed successfully",
      repo,
    });
  } catch (error) {
    console.error("Error removing repository:", error);
    res.status(500).json({ message: "Failed to remove repository", error });
  }
};


// Save the user organizations and repositories in db
export const saveUserOrgsAndRepos = async (req, res) => {
  const { accessToken } = req.user;
  const userId = req.user._id;
  const octokit = new Octokit({ auth: accessToken });

  try {
    const organizations = [];
    const repos = [];
    let page = 1;
    const perPage = 100; // GitHub API max limit is 100 items per page

    // Fetch organizations with pagination
    while (true) {
      const { data: orgsPage } =
        await octokit.rest.orgs.listForAuthenticatedUser({
          page,
          per_page: perPage,
        });
      if (orgsPage.length === 0) break;

      organizations.push(...orgsPage);
      page++;
    }

    // Save organizations and fetch repositories for each organization
    for (const org of organizations) {
      const savedOrg = await Organization.findOneAndUpdate(
        { orgId: org.id, userId },
        {
          orgId: org.id,
          name: org.name,
          login: org.login,
          description: org.description,
          url: org.html_url,
          userId,
        },
        { upsert: true, new: true }
      );

      // Fetch organization repositories with pagination
      page = 1;
      while (true) {
        const { data: reposPage } = await octokit.rest.repos.listForOrg({
          org: org.login,
          page,
          per_page: perPage,
        });
        if (reposPage.length === 0) break;

        for (const repo of reposPage) {
          const existingRepo = await Repo.findOne({ repoId: repo.id, userId });
          const included = existingRepo ? existingRepo.included : false;

          const savedRepo = await Repo.findOneAndUpdate(
            { repoId: repo.id, userId },
            {
              repoId: repo.id,
              name: repo.name,
              full_name: repo.full_name,
              private: repo.private,
              url: repo.html_url,
              description: repo.description,
              orgId: savedOrg._id,
              userId,
              included,
            },
            { upsert: true, new: true }
          );

          repos.push(savedRepo);
        }

        page++;
      }
    }

    res.status(200).json({
      message: "Organizations and repositories saved successfully",
      organizations,
      repos,
    });
  } catch (error) {
    console.error("Error saving organizations and repositories:", error);
    res.status(500).json({
      message: "Failed to save organizations and repositories",
      error,
    });
  }
};


// Get the user's saved organizations and repositories
export const getIncludedReposDetails = async (req, res) => {
  const { accessToken } = req.user;
  const userId = req.user._id;
  const octokit = new Octokit({ auth: accessToken });

  try {
    const includedRepos = await Repo.find({ userId, included: true });
    const repoDetails = [];

    for (const repo of includedRepos) {
      const [repoOwner, repoName] = repo.full_name.split("/");

      let commits = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const { data: commitPage } = await octokit.rest.repos.listCommits({
          owner: repoOwner,
          repo: repoName,
          page,
          per_page: perPage,
        });
        if (commitPage.length === 0) break;
        commits.push(...commitPage);
        page++;
      }

      let pullRequests = [];
      page = 1;
      while (true) {
        const { data: pullRequestPage } = await octokit.rest.pulls.list({
          owner: repoOwner,
          repo: repoName,
          state: "all",
          page,
          per_page: perPage,
        });
        if (pullRequestPage.length === 0) break;
        pullRequests.push(...pullRequestPage);
        page++;
      }

      let issues = [];
      page = 1;
      while (true) {
        const { data: issuesPage } = await octokit.rest.issues.listForRepo({
          owner: repoOwner,
          repo: repoName,
          state: "all",
          page,
          per_page: perPage,
        });
        if (issuesPage.length === 0) break;
        issues.push(...issuesPage);
        page++;
      }

      repoDetails.push({
        user: userId,
        repoId: repo.repoId,
        commits,
        pullRequests,
        issues,
      });
    }

    res.status(200).json(repoDetails);
  } catch (error) {
    console.error("Error fetching included repository details:", error);
    res.status(500).json({
      message: "Failed to fetch included repository details",
      error,
    });
  }
};
