import mongoose from "mongoose";

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

export default mongoose.model("Case", Case);
