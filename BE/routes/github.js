import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

var router = express.Router();

import "../config/db.js";
import "../controllers/github.js";
import User from "../models/userModel.js";
import { verifyToken } from "../middleware/verifyToken.js";

// GitHub login route
router.get("/github", passport.authenticate("github"));

// GitHub callback route
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.clientUrl}?token=error`,
  }),
  (req, res) => {
    const token = req.user.token;

    const decoded = jwt.verify(token, process.env.JwtSecret);

    res.redirect(
      `${process.env.clientUrl}/?token=${token}&id=${decoded._id}&name=${decoded.name}&username=${decoded.username}&photo=${decoded.photo}&email=${decoded.email}`
    );
  }
);

// Route to remove GitHub authorization
router.delete("/remove-auth", verifyToken, async (req, res) => {
  try {
    const decoded = jwt.verify(req.token, process.env.JwtSecret);
    const userId = decoded._id;

    const userData = await User.findByIdAndDelete(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Error deleting user", error });
  }
});

export default router;
