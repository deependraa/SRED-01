// models/issueModel.js
import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    issueId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: String, required: true }, // e.g., open, closed
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

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
