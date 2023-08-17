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
  }
}

export default new CaseService();
