import * as jwt from "jsonwebtoken";
import UserModel from "../../models/UserModel";

// eslint-disable-next-line no-unused-vars, no-shadow
export default async function isAuthenticated(req, res, next) {
  let token = req.headers.authorization;
  if (!token) res.status(401).json({ message: "Token missing" });
  else {
    try {
      token = token.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRET);
      const userData = await UserModel.findById(user.id).lean();
      if (!userData) return res.status(401).json({ message: "Invalid Token" });

      req.user = userData;
      next();
    } catch (err) {
      console.log("Error Authenticating User", err, req.headers.authorization);
      res.status(401).json({ message: err.message || "Invalid Token" });
    }
  }
}
