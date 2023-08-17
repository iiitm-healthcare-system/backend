import userService from "../../services/user.service";
import l from "../../../common/logger";
import authenticationService from "../../services/authentication.service";
import ValidationService from "../../services/validation.service";
import caseService from "../../services/case.service";

export class Controller {
  async createCase(req, res, next) {
    try {
      if (req.user.role !== "doctor") {
        throw new Error("Only Doctors are allowed to create cases");
      }

      let { patient, vitals, complains, diagnosis, prescription } = req.body;

      const caseDoc = await caseService.createCase(
        patient,
        vitals,
        complains,
        diagnosis,
        prescription,
        req.user._id
      );

      res.status(200).send(caseDoc);
    } catch (err) {
      l.error(err, "CREATE CASE CONROLLER");
      next(err);
    }
  }

  async getAllCases(req, res, next) {
    try {
      const { page, limit } = req.query;
      const cases = await caseService.getAllCases(page, limit, req.user);
      res.status(200).send(cases);
    } catch (err) {
      l.error(err, "GET ALL CASES CONTROLLER");
      next(err);
    }
  }
}
export default new Controller();
