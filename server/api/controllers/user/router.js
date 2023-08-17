import * as express from "express";
import controller from "./controller";
import isAuthenticated from "../../middlewares/isAuthenticated.jwt";

export default express
  .Router()
  .get("/", isAuthenticated, controller.getUser)
  .get("/patients", isAuthenticated, controller.searchPatients);
