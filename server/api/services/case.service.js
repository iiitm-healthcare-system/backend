import axios from "axios";
import url from "url";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import { Mongoose } from "mongoose";
import { ENVIROMENT_CONSTANTS } from "../../common/config";
import l from "../../common/logger";
import validationService from "./validation.service";
import CaseModel from "../../models/CaseModel";

class CaseService {
  async createCase(
    patient,
    vitals,
    complaints,
    diagnosis,
    prescription,
    doctor
  ) {
    try {
      const caseDoc = await CaseModel.create({
        patient,
        doctor,
        attendant: null,
        status: "ongoing",
        vitals,
        complaints,
        diagnosis,
        prescription,
        completedAt: null,
        completedBy: null,
      });
      return caseDoc;
    } catch (err) {
      l.error(err, "CREATE CASE ERROR");
    }
  }

  async getAllCases(page = 1, limit = 10, user) {
    try {
      const query = {};
      if (user.role == "doctor") {
        query.doctor = user._id;
      } else if (user.role == "patient") {
        query.patient = user._id;
      }

      let cases = CaseModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(["patient", "doctor", "attendant", "completedBy"])
        .lean();

      let count = CaseModel.countDocuments(query);
      [cases, count] = await Promise.all([cases, count]);
      return {
        cases,
        count,
      };
    } catch (err) {
      l.error(err, "GET ALL CASES ERROR");
    }
  }
}

export default new CaseService();
