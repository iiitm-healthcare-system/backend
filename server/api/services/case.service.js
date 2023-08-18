import axios from "axios";
import url from "url";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import { Mongoose } from "mongoose";
import { ENVIROMENT_CONSTANTS } from "../../common/config";
import l from "../../common/logger";
import validationService from "./validation.service";
import CaseModel from "../../models/CaseModel";

const timeframWiseIntervals = {
  week: {
    count: 7,
  },
  month: {
    count: 30,
  },
  year: {
    count: 365,
  },
};
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
      this.handleCaseCreation(caseDoc._id);
      return caseDoc;
    } catch (err) {
      l.error(err, "CREATE CASE ERROR");
      throw err;
    }
  }

  async handleCaseCreation(caseId) {
    try {
      // Get Populated data
      const caseData = await CaseModel.findById(caseId)
        .populate(["patient", "doctor"])
        .lean();

      const { data } = await axios.post(
        process.env.PROCESSOR_BASE_URL + "/",
        caseData
      );

      console.log("CASE HANDLING SUCCESSFUL: ", caseData._id, data);

      await CaseModel.updateOne(
        {
          _id: caseData._id,
        },
        {
          publicURL: data.publicURL,
        }
      );
    } catch (err) {
      l.error(err, "CASE SUCCESS HANDLING ERROR");
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
        .sort({
          createdAt: -1,
        })
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
      throw err;
    }
  }

  async getCaseById(id) {
    try {
      const caseData = await CaseModel.findById(id)
        .populate(["patient", "doctor", "attendant", "completedBy"])
        .lean();
      if (!caseData) throw new Error("Case not found");
      return caseData;
    } catch (err) {
      l.error(err, "GET CASE BY ID ERROR");
      throw err;
    }
  }

  async markMedicineAsGiven(caseId, medicineId, user) {
    try {
      const caseData = await CaseModel.findById(caseId).lean();
      if (!caseData) {
        throw new Error("Case Not Found");
      }
      if (caseData.prescription.medications.length <= medicineId) {
        throw new Error("Medicine Not Found");
      }
      if (caseData.prescription.medications[medicineId].provided) {
        throw new Error("Medicine Already Provided");
      }

      const medications = caseData.prescription.medications;
      medications[medicineId].provided = true;

      await CaseModel.updateOne(
        {
          _id: caseId,
        },
        {
          $set: {
            "prescription.medications": medications,
            attendant: user._id,
          },
        }
      );
    } catch (err) {
      l.error(err, "MARK MED AS GIVEN ERROR");
      throw err;
    }
  }

  async markCaseResolved(caseId, user) {
    try {
      const caseData = await CaseModel.findById(caseId).lean();
      if (!caseData) {
        throw new Error("Case Not Found");
      }

      if (caseData.status == "completed") {
        throw new Error("Case Already Completed");
      }

      await CaseModel.updateOne(
        {
          _id: caseId,
        },
        {
          $set: {
            status: "completed",
            completedAt: Date.now(),
            completedBy: user._id,
          },
        }
      );
    } catch (err) {
      l.error(err, "MARK MED AS GIVEN ERROR");
      throw err;
    }
  }

  async getAnalytics(timeframe = "week", type = "ongoing") {
    const startDate = new Date();
    startDate.setDate(
      startDate.getDate() - timeframWiseIntervals[timeframe].count + 1
    );
    const matchQuery = {
      createdAt: { $gte: startDate }, // Filter documents created after 'startDate'
    };

    if (type == "ongoing" || type == "completed") {
      matchQuery.status = type;
    }

    try {
      let data = await CaseModel.aggregate([
        {
          $match: matchQuery,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $project: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
        {
          $group: {
            _id: "$day",
            count: { $sum: 1 }, // Count the number of cases for each date
          },
        },
      ]);

      data = data.map((item) => ({
        label: item._id,
        count: item.count,
      }));

      const dateList = [];
      for (let i = 0; i < timeframWiseIntervals[timeframe].count; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        dateList.push(
          `${currentDate.getFullYear()}-${
            currentDate.getMonth() + 1
          }-${currentDate.getDate()}`
        );
      }

      const finalData = dateList.map((date) => {
        const matchingData = data.find((data) => {
          return (
            data.label
              .split("-")
              .map((item) => parseInt(item))
              .join("-") === date
          );
        });
        return {
          label: date,
          count: matchingData ? matchingData.count : 0,
        };
      });

      return finalData;
    } catch (err) {
      l.error(err, "GET ANALYTICS");
      throw err;
    }
  }

  async getStats() {
    try {
      // Get the current date and the start of the week
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      // Query to get total cases this week
      let totalCasesThisWeek = await CaseModel.countDocuments({
        createdAt: { $gte: startOfWeek },
      });

      // Query to get total cases completed this week
      let totalCasesCompletedThisWeek = await CaseModel.countDocuments({
        completedAt: { $gte: startOfWeek },
        status: "completed",
      });

      // Query to get total ongoing cases
      let totalOngoingCases = await CaseModel.countDocuments({
        status: "ongoing",
      });

      // Query to get total number of medication provided
      let totalMedicationProvided = await CaseModel.aggregate([
        {
          $unwind: "$prescription.medications",
        },
        {
          $match: { "prescription.medications.provided": true },
        },
        {
          $group: {
            _id: null,
            totalMedicationProvided: { $sum: 1 },
          },
        },
      ]);

      // Query to get total number of medications not provided
      let totalMedicationNotProvided = await CaseModel.aggregate([
        {
          $unwind: "$prescription.medications",
        },
        {
          $match: { "prescription.medications.provided": false },
        },
        {
          $group: {
            _id: null,
            totalMedicationNotProvided: { $sum: 1 },
          },
        },
      ]);

      [
        totalCasesThisWeek,
        totalCasesCompletedThisWeek,
        totalOngoingCases,
        totalMedicationProvided,
        totalMedicationNotProvided,
      ] = await Promise.all([
        totalCasesThisWeek,
        totalCasesCompletedThisWeek,
        totalOngoingCases,
        totalMedicationProvided,
        totalMedicationNotProvided,
      ]);

      return {
        cases: totalCasesThisWeek,
        recovered: totalCasesCompletedThisWeek,
        ongoing: totalOngoingCases,
        medicationProvided:
          totalMedicationProvided[0]?.totalMedicationProvided || 0,
        medicationNotProvided:
          totalMedicationNotProvided[0]?.totalMedicationNotProvided || 0,
      };
    } catch (err) {
      l.error(err, "GET STATS");
      throw err;
    }
  }
}

export default new CaseService();
