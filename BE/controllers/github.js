import passport from "passport";
import jwt  from "jsonwebtoken";
import {Strategy as GithubStrategy} from "passport-github";
import User from "../models/userModel.js";
import axios from 'axios';

import * as dotenv from 'dotenv'
dotenv.config()


// Passport Github Strategy
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GithubclientID,
      clientSecret: process.env.GithubclientSecret,
      callbackURL: "/auth/github/callback",
      profileFields: ["email", "displayName", "photos"]
    },
    function (accessToken, refreshToken, profile, done) {
      const userdata = {
        name: profile.displayName,
        username: profile.username,
        email: profile._json.email,
        photo: profile._json.avatar_url,
      };

      User.findOne({ email: profile._json.email }, (err, user) => {
        if (err) return done(err);

        const secret = process.env.JwtSecret;

        if (user) {
          // Include the user's `_id` in the JWT payload
          userdata._id = user._id;

          const token = jwt.sign(userdata, secret, { expiresIn: '24h' });
          user.token = token;

          user.save((err) => {
            if (err) return done(err);
            return done(null, user); 
          });
        } else {
          const token = jwt.sign(userdata, secret, { expiresIn: '24h' });

          // Create a new user with the token included
          User.create({ ...userdata, token }, (err, newUser) => {
            if (err) return done(err);

            // Update `userdata` to include the new user's `_id`
            userdata._id = newUser._id;
            userdata.token = jwt.sign(userdata, secret, { expiresIn: '24h' });
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


