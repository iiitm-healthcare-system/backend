import * as express from "express";
import controller from "./controller";
import isAuthenticated from "../../middlewares/isAuthenticated.jwt";

export default express
  .Router()
  .post("/", isAuthenticated, controller.createCase)
  .get("/", isAuthenticated, controller.getAllCases)
  .get("/analytics", isAuthenticated, controller.getAnalytics)
  .get("/:id", isAuthenticated, controller.getCaseByID)
  .post("/medication/markAsGiven/:id", isAuthenticated, controller.markAsGiven)
  .post("/markComplete/:id", isAuthenticated, controller.markAsComplete);
