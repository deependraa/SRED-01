// models/repoModel.js
import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
  {
    repoId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    full_name: { type: String, required: true },
    private: { type: Boolean, required: true },
    url: { type: String, required: true },
    description: { type: String },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GitHubUser",
      required: true,
    },
    included: { type: Boolean, default: false }, // Indicates if further data should be fetched
  },
  { timestamps: true }
);

const Repo = mongoose.model("Repo", repoSchema);
export default Repo;
