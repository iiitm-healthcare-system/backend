const { faker } = require("@faker-js/faker");
const mongoose = require("mongoose");

// MongoDB connection string
const url = "mongodb://localhost:27017/btp_test";

// Number of fake users to insert
const numOfCases = 50000;
const patient = "64e706f86ee1f463d8ac3668";
const doctor = "64e706f86ee1f463d8ac3674";
const attendant = "64e706f86ee1f463d8ac366d";

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

async function insertFakeUsers() {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const caseData = new Array(numOfCases).fill(null).map(() => {
      return {
        patient,
        doctor,
        attendant,
        status: "ongoing",
        vitals: {
          height: faker.number.int({ min: 150, max: 200 }),
          weight: faker.number.int({ min: 50, max: 100 }),
          pulse: faker.number.int({ min: 60, max: 100 }),
          temperature: faker.number.int({ min: 97, max: 99 }),
          bloodPressure: faker.helpers.arrayElement([
            "120/80",
            "130/90",
            "140/100",
          ]),
        },
        complaints: [
          {
            description: faker.lorem.sentence(),
            severity: faker.helpers.arrayElement(["moderate", "high", "mild"]),
            frequency: faker.helpers.arrayElement([
              "constant",
              "hourly",
              "daily",
              "weekly",
              "rarely",
            ]),
            duration: faker.number.int({ min: 1, max: 10 }),
          },
        ],
        diagnosis: [faker.lorem.sentence()],
        prescription: {
          medications: [
            {
              name: faker.lorem.sentence(),
              quantity: faker.number.int({ min: 1, max: 10 }),
              dosage: {
                morning: {
                  beforeMeal: Math.random() > 0.5,
                  afterMeal: Math.random() > 0.5,
                },
                afternoon: {
                  beforeMeal: Math.random() > 0.5,
                  afterMeal: Math.random() > 0.5,
                },
                night: {
                  beforeMeal: Math.random() > 0.5,
                  afterMeal: Math.random() > 0.5,
                },
              },
              provided: Math.random() > 0.5,
              notes: faker.lorem.paragraph(),
              type: faker.helpers.arrayElement(["dosage", "notes"]),
            },
          ],
          advice: faker.lorem.paragraph(),
        },
        completedAt: faker.date.past(),
        completedBy: faker.helpers.arrayElement([doctor, patient]),
      };
    });

    await CaseModel.insertMany(caseData);

    console.log(`Inserted ${numOfCases} fake user documents.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

insertFakeUsers();
