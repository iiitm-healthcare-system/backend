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

  async getCaseByID(req, res, next) {
    try {
      const { id } = req.params;
      const casesData = await caseService.getCaseById(id);
      res.status(200).send(casesData);
    } catch (err) {
      l.error(err, "GET ALL CASES CONTROLLER");
      next(err);
    }
  }

  async markAsGiven(req, res, next) {
    try {
      if (req.user.role != "attendant") {
        throw new Error("Only Attendant are allowed to provide medication");
      }

      const { id: caseId } = req.params;
      const { medicineId } = req.body;

      await caseService.markMedicineAsGiven(caseId, medicineId, req.user);
      res.status(200).send({
        message: "Marked As Proviced Successfully",
      });
    } catch (err) {
      l.error(err, "MARK MEDS AS GIVEN CONTROLLER");
      next(err);
    }
  }

  async markAsComplete(req, res, next) {
    try {
      const { id: caseId } = req.params;
      await caseService.markCaseResolved(caseId, req.user);
      res.status(200).send({
        message: "Marked As Completed Successfully",
      });
    } catch (err) {
      l.error(err, "CASE MEDS AS COMPLETE CONTROLLER");
      next(err);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const { timeframe, type } = req.query;
      const data = await caseService.getAnalytics(timeframe, type);
      res.status(200).send(data);
    } catch (err) {
      l.error(err, "GET ANALYTICS CONTROLLER");
      next(err);
    }
  }

  async getStats(req, res, next) {
    try {
      const data = await caseService.getStats();
      res.status(200).send(data);
    } catch (err) {
      l.error(err, "GET STATS CONTROLLER");
      next(err);
    }
  }
}

export default new Controller();
