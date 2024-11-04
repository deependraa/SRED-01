import express from "express";
import logger from "morgan";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";
import "./config/db.js";

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const serverPort = process.env.ServerPort;

import "./controllers/github.js";
import githubRouter from "./routes/github.js";
import userRouter from "./routes/userRoutes.js";

app.use(
  cors({
    origin: "*",
    // methods: "GET,POST,PUT,DELETE.PATCH",
    // credentials: true,
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

// ALL ROUTES
app.use("/auth", githubRouter);
app.use("/users", userRouter);

// server details
app.listen(serverPort, () =>
  console.log(`Server running on port ${serverPort}...🚀`)
);

export default app;
