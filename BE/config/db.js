import mongoose from "mongoose";

import * as dotenv from "dotenv";
dotenv.config();

const mongoDbUrl = process.env.MongoDbUrl;
console.log("mongoDbUrl :", mongoDbUrl);

mongoose.set("strictQuery", true);

mongoose
  .connect(mongoDbUrl)
  .then(() => {
    console.log("Database Connected...🛸");
  })
  .catch((error) => {
    console.log("Database not connected...😱", error);
  });
