import jwt from "jsonwebtoken";

import * as dotenv from "dotenv";
dotenv.config();

// Verify Token Middleware
export const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {

    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];

    req.token = bearerToken;

    try {
      const decoded = jwt.verify(req.token, process.env.JwtSecret);

      next();

    } catch (error) {
      return res.json({ message: "Token not verified", error });
    }
  } else {
    res.sendStatus(403);
  }
}
