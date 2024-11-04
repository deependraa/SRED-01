import express from "express";
import {
  getIncludedReposDetails,
  includeRepo,
  removeRepo,
  saveUserOrgsAndRepos,
} from "../controllers/github.js";
import { verifyToken } from "../middleware/verifyToken.js";

const userRouter = express.Router();

userRouter.get("/organizations-and-repos", verifyToken, saveUserOrgsAndRepos);
userRouter.get("/repos/included-details", verifyToken, getIncludedReposDetails);
userRouter.post("/repos/:repoId/include", verifyToken, includeRepo);
userRouter.delete("/repos/:repoId/remove", verifyToken, removeRepo);
export default userRouter;
