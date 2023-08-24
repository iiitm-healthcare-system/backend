import Express from "express";

import cors from "cors";

import * as path from "path";
import * as bodyParser from "body-parser";
import * as http from "http";
import * as os from "os";
import l from "./logger";
import * as OpenApiValidator from "express-openapi-validator";
import errorHandler from "../api/middlewares/error.handler";
import promBundle from "express-prom-bundle";
import client from "prom-client";
// import register from "./internalRegister";
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    project_name: "btp_backend",
    project_type: "test_metrics_labels",
  },
  promClient: {
    collectDefaultMetrics: {},
  },
});
// add the prometheus middleware to all routes

import mongo from "./mongo";

const app = new Express();
app.use(cors());
app.use(metricsMiddleware);

export default class ExpressServer {
  constructor() {
    const root = path.normalize(`${__dirname}/../..`);

    const apiSpec = path.join(__dirname, "api.yml");
    const validateResponses = !!(
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === "true"
    );

    app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(
      bodyParser.urlencoded({
        extended: true,
        limit: process.env.REQUEST_LIMIT || "100kb",
      })
    );
    app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));

    app.use(Express.static(`${root}/public`));

    app.use(process.env.OPENAPI_SPEC || "/spec", Express.static(apiSpec));
    app.use(
      OpenApiValidator.middleware({
        apiSpec,
        validateResponses,
        ignorePaths: /.*\/spec(\/|$)/,
      })
    );
  }

  router(routes) {
    app.get("/metrics", async (req, res) => {
      res.set("Content-Type", client.register.contentType);
      console.log(await client.register.metrics());
      res.send(await client.register.metrics());
    });
    routes(app);
    app.use(errorHandler);
    return this;
  }

  listen(port = process.env.PORT) {
    const welcome = (p) => () =>
      l.info(
        `up and running in ${
          process.env.NODE_ENV || "development"
        } @: ${os.hostname()} on port: ${p}}`
      );

    mongo().then(() => {
      l.info("Database Loaded!");
      http.createServer(app).listen(port, welcome(port));
    });

    return app;
  }
}
