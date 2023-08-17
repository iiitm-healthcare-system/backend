import * as express from "express";
import controller from "./controller";
var pdf = require("pdf-creator-node");
var fs = require("fs");

export default express
  .Router()
  // .post("/signup", controller.signup)
  .post("/login", controller.login)
  .post("/google-login", controller.googleLogin)
  .post("/test", (req, res) => {
    //Required package

    // Read HTML Template
    var html = fs.readFileSync("template.html", "utf8");
    var options = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
    };

    var users = [
      {
        name: "Shyam",
        age: "26",
      },
      {
        name: "Navjot",
        age: "26",
      },
      {
        name: "Vitthal",
        age: "26",
      },
    ];
    var document = {
      html: html,
      data: {
        users: users,
      },
      path: "./output.pdf",
      type: "",
    };

    pdf
      .create(document, options)
      .then((resp) => {
        console.log(resp);
        res.status(200).send({ resp });
      })
      .catch((error) => {
        console.error(error);
        res.status(200).send({ error });
      });
  });
