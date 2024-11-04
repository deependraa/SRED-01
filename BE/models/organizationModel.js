// models/organizationModel.js
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    login: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GitHubUser",
      required: true,
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);
export default Organization;
