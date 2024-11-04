// models/pullRequestModel.js
import mongoose from "mongoose";

const pullRequestSchema = new mongoose.Schema(
  {
    prId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: String, required: true }, // e.g., open, closed, merged
    url: { type: String, required: true },
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GitHubUser",
      required: true,
    },
  },
  { timestamps: true }
);

const PullRequest = mongoose.model("PullRequest", pullRequestSchema);
export default PullRequest;
