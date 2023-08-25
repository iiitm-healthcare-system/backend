import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  // .post("/signup", controller.signup)
  .post("/login", controller.login)
  .post("/google-login", controller.googleLogin)
  .post("/test", (req, res) => {
    res.status(200).send({ working: true });
  });
