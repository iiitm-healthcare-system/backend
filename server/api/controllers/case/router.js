import * as express from "express";
import controller from "./controller";
import isAuthenticated from "../../middlewares/isAuthenticated.jwt";

export default express
  .Router()
  .post("/", isAuthenticated, controller.createCase)
  .get("/", isAuthenticated, controller.getAllCases)
  .get("/:id", isAuthenticated, controller.getCaseByID);
