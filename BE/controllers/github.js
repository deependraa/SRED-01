import passport from "passport";
import jwt from "jsonwebtoken";
import { Strategy as GithubStrategy } from "passport-github";
import User from "../models/userModel.js";
import axios from "axios";

import * as dotenv from "dotenv";
import Repo from "../models/repoModel.js";
import Organization from "../models/organizationModel.js";
dotenv.config();

// Passport Github Strategy
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GithubclientID,
      clientSecret: process.env.GithubclientSecret,
      callbackURL: "/auth/github/callback",
      scope: ["user", "read:org"], // Add the required scope here
      profileFields: ["email", "displayName", "photos"],
    },
    function (accessToken, refreshToken, profile, done) {
      const userdata = {
        name: profile.displayName,
        username: profile.username,
        email: profile._json.email,
        photo: profile._json.avatar_url,
        accessToken,
      };

      User.findOne({ email: profile._json.email }, (err, user) => {
        if (err) return done(err);

        const secret = process.env.JwtSecret;

        if (user) {
          userdata._id = user._id;
          const token = jwt.sign(userdata, secret, { expiresIn: "24h" });
          user.token = token;

          user.save((err) => {
            if (err) return done(err);
            return done(null, user);
          });
        } else {
          const token = jwt.sign(userdata, secret, { expiresIn: "24h" });

          User.create({ ...userdata, token }, (err, newUser) => {
            if (err) return done(err);

            userdata._id = newUser._id;
            userdata.token = jwt.sign(userdata, secret, { expiresIn: "24h" });
            newUser.token = userdata.token;

            newUser.save((err) => {
              if (err) return done(err);
              return done(null, newUser);
            });
          });
        }
      });
    }
  )
);

// This  will creates the session and adds  the userid in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// now  if the user is already logged in then  deserailze user comes into picture
// it will grab  the id  from the cookie and finds this in the database
passport.deserializeUser((id, done) => {
  User.findById(id, "name , email ,username, token", (err, user) => {
    done(err, user);
  });
});

// export const getRepoData = async (req, res) => {
//   const { org, repo } = req.params;
//   const { accessToken } = req.user;

//   try {
//     const [commits, pullRequests, issues] = await Promise.all([
//       axios.get(`https://api.github.com/repos/${org}/${repo}/commits`, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       }),
//       axios.get(`https://api.github.com/repos/${org}/${repo}/pulls`, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       }),
//       axios.get(`https://api.github.com/repos/${org}/${repo}/issues`, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       }),
//     ]);

//     res.json({
//       commits: commits.data,
//       pullRequests: pullRequests.data,
//       issues: issues.data,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch repository data", error });
//   }
// };

export const saveUserOrgsAndRepos = async (req, res) => {
  const { accessToken } = req.user;
  const userId = req.user._id;

  try {
    // Fetch organizations
    const orgsResponse = await axios.get("https://api.github.com/user/orgs", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const organizations = orgsResponse.data;
    const repos = [];

    for (const org of organizations) {
      const savedOrg = await Organization.findOneAndUpdate(
        { orgId: org.id, userId },
        {
          orgId: org.id,
          name: org.name,
          login: org.login,
          description: org.description,
          url: org.html_url,
          userId: userId,
        },
        { upsert: true, new: true }
      );

      // Fetch repos for each organization
      const reposResponse = await axios.get(
        `https://api.github.com/orgs/${org.login}/repos`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      for (const repo of reposResponse.data) {
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
            userId: userId,
            included: included,
          },
          { upsert: true, new: true }
        );

        repos.push(savedRepo);
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

// Fetch data for included repos
export const getIncludedReposDetails = async (req, res) => {
  const userId = req.user._id;

  try {
    // Fetch included repositories for the user
    const includedRepos = await Repo.find({ userId, included: true });
    const repoDetails = [];

    for (const repo of includedRepos) {
      const repoOwner = repo.full_name.split("/")[0]; // Extract owner from full name
      const repoName = repo.full_name.split("/")[1]; // Extract repo name from full name

      // Construct API URLs
      const commitsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits`;
      const pullRequestsUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=all`;
      const issuesUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/issues?state=all`;

      // Fetch commits, pull requests, and issues data using the correct URLs
      const [commits, pullRequests, issues] = await Promise.all([
        axios.get(commitsUrl, {
          headers: { Authorization: `Bearer ${req.user.accessToken}` },
        }),
        axios.get(pullRequestsUrl, {
          headers: { Authorization: `Bearer ${req.user.accessToken}` },
        }),
        axios.get(issuesUrl, {
          headers: { Authorization: `Bearer ${req.user.accessToken}` },
        }),
      ]);

      repoDetails.push({
        user: userId,
        repoId: repo.repoId,
        commits: commits.data,
        pullRequests: pullRequests.data,
        issues: issues.data,
      });
    }

    res.status(200).json(repoDetails);
  } catch (error) {
    console.error("Error fetching included repository details:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch included repository details", error });
  }
};

export const includeRepo = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;

  try {
    // Update the repository to set included to true
    const repo = await Repo.findOneAndUpdate(
      { repoId, userId },
      { included: true },
      { new: true }
    );

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    // Fetch data for commits, PRs, and issues if necessary
    const [commits, pullRequests, issues] = await Promise.all([
      axios.get(`${repo.url}/commits`, {
        headers: { Authorization: `Bearer ${req.user.accessToken}` },
      }),
      axios.get(`${repo.url}/pulls`, {
        headers: { Authorization: `Bearer ${req.user.accessToken}` },
      }),
      axios.get(`${repo.url}/issues`, {
        headers: { Authorization: `Bearer ${req.user.accessToken}` },
      }),
    ]);

    // Return response with the repo and related data
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

export const removeRepo = async (req, res) => {
  const { repoId } = req.params;
  const userId = req.user._id;

  try {
    // Update the repository to set included to false and remove related data
    const repo = await Repo.findOneAndUpdate(
      { repoId, userId },
      { included: false },
      { new: true }
    );

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    // Optionally, remove associated data from your database if needed
    // For example:
    // await Commit.deleteMany({ repoId, userId });
    // await PullRequest.deleteMany({ repoId, userId });
    // await Issue.deleteMany({ repoId, userId });

    res.status(200).json({
      message: "Repository removed successfully",
      repo,
    });
  } catch (error) {
    console.error("Error removing repository:", error);
    res.status(500).json({ message: "Failed to remove repository", error });
  }
};
