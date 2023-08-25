const { faker } = require("@faker-js/faker");
const mongoose = require("mongoose");

// MongoDB connection string
const url = "mongodb://localhost:27017/btp_test";

const User = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["doctor", "patient", "attendant", "admin"],
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const UserModel = mongoose.model("User", User);
const Case = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attendant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["admit", "ongoing", "completed"],
      required: true,
      default: "ongoing",
    },
    vitals: {
      height: Number,
      weight: Number,
      pulse: Number,
      temperature: Number,
      bloodPressure: String,
    },
    complaints: [
      {
        description: String,
        severity: {
          type: String,
          enum: ["moderate", "high", "mild"],
          required: true,
        },
        frequency: {
          type: String,
          enum: ["constant", "hourly", "daily", "weekly", "rarely"],
          required: true,
        },
        duration: Number,
      },
    ],
    diagnosis: [String],
    prescription: {
      medications: [
        {
          name: String,
          quantity: Number,
          dosage: {
            morning: {
              beforeMeal: Boolean,
              afterMeal: Boolean,
            },
            afternoon: {
              beforeMeal: Boolean,
              afterMeal: Boolean,
            },
            night: {
              beforeMeal: Boolean,
              afterMeal: Boolean,
            },
          },
          provided: Boolean,
          notes: String,
          type: { type: String, enum: ["dosage", "notes"], required: true },
        },
      ],
      advice: String,
    },
    completedAt: Date,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publicURL: String,
  },
  {
    timestamps: true,
  }
);
const CaseModel = mongoose.model("Case", Case);

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

const queries = [
  {
    title: "Get Analytics",
    optimisedQuery: async (timeframe = "week", type = "ongoing") => {
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
    },
    unoptimisedQuery: async (timeframe = "week", type = "ongoing") => {
      const startDate = new Date();
      startDate.setDate(
        startDate.getDate() - timeframWiseIntervals[timeframe].count + 1
      );

      let data = await CaseModel.aggregate([
        {
          $match: {
            $expr: {
              $gte: ["$createdAt", new Date(startDate)],
            },
          },
        },
        {
          $addFields: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
        {
          $group: {
            _id: "$day",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            label: "$_id",
            count: 1,
          },
        },
      ]);

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
    },
  },
  {
    title: "Get Case Data",
    unoptimisedQuery: async (id = "64e72358d80c1d37d0914956") => {
      const caseData = await CaseModel.findById(id).lean();
      if (!caseData) {
        throw new Error("Case not found");
      }

      // Manually fetch related data from other models
      const patientData = await UserModel.findById(caseData.patient);
      const doctorData = await UserModel.findById(caseData.doctor);
      const attendantData = await UserModel.findById(caseData.attendant);
      const completedByData = await UserModel.findById(caseData.completedBy);

      // Combine the fetched data
      const combinedData = {
        case: caseData,
        patient: patientData,
        doctor: doctorData,
        attendant: attendantData,
        completedBy: completedByData,
      };

      return combinedData;
    },
    optimisedQuery: async (id = "64e72358d80c1d37d0914956") => {
      const caseData = await CaseModel.findById(id)
        .populate(["patient", "doctor", "attendant", "completedBy"])
        .lean();
      if (!caseData) throw new Error("Case not found");
      return caseData;
    },
  },
  {
    title: "Get User Data",
    optimisedQuery: async (id = "64e706f86ee1f463d8ac3668") => {
      const userData = await UserModel.findById(id).lean();
      if (!userData) throw new Error("User not found");
      return userData;
    },
    unoptimisedQuery: async (id = "64e706f86ee1f463d8ac3668") => {
      const userData = await UserModel.findOne({ _id: id });
      if (!userData) throw new Error("User not found");
      return userData;
    },
  },
];

async function insertFakeUsers() {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB\n");

    for (let index = 0; index < queries.length; index++) {
      const query = queries[index];

      console.time(`UNOPTIMISED: ${query.title.toUpperCase()}`);
      const optimisedQuery = await query.optimisedQuery();
      console.timeEnd(`UNOPTIMISED: ${query.title.toUpperCase()}`);
      console.time(`OPTIMISED: ${query.title.toUpperCase()}`);
      const unoptimisedQuery = await query.unoptimisedQuery();
      console.timeEnd(`OPTIMISED: ${query.title.toUpperCase()}`);
      console.log("");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

insertFakeUsers();
