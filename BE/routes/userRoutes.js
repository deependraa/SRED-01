import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getIncludedReposDetails,
  includeRepo,
  removeRepo,
  saveUserOrgsAndRepos,
} from "../controllers/github.js";
import {getCollections, dynamicSearchAndFilter} from "../controllers/controller.js"

const userRouter = express.Router();

userRouter.get("/organizations-and-repos", verifyToken, saveUserOrgsAndRepos);
userRouter.get("/repos/included-details", verifyToken, getIncludedReposDetails);
userRouter.post("/repos/:repoId/include", verifyToken, includeRepo);
userRouter.delete("/repos/:repoId/remove", verifyToken, removeRepo);


// Search and filter routes

userRouter.get("/collections", verifyToken, getCollections);
userRouter.post("/collections/search", verifyToken, dynamicSearchAndFilter);



export default userRouter;
