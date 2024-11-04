import mongoose from "mongoose";

let userSchema = mongoose.Schema(
  {
    token: {
      type: String,
    },
    name: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
    },
    photo: {
      type: String,
    },
    accessToken: {
      type: String,
    },
  },
  { timestamps: true }
);
let User = mongoose.model("GitHubUser", userSchema);
export default User;
