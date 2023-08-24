const { faker } = require("@faker-js/faker");
const mongoose = require("mongoose");

// MongoDB connection string
const url = "mongodb://localhost:27017/btp_test";

// Number of fake users to insert
const numUsers = 100000;

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

async function insertFakeUsers() {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // name
    // email
    // password
    // phone
    // role
    // dob
    // gender

    // for (let i = 0; i < numUsers; i++) {
    //   const fakeUser = {
    //     name: faker.person.fullName(),
    //     role: faker.helpers.arrayElement([
    //       "doctor",
    //       "patient",
    //       "attendant",
    //       "admin",
    //     ]),
    //     email: faker.internet.email(),
    //     password: faker.internet.password(),
    //     phone: faker.phone.number(),
    //     dob: faker.date.past(),
    //     gender: faker.helpers.arrayElement(["Male", "Female", "Others"]),
    //   };
    //   await UserModel.create(fakeUser);
    // }

    const usersData = new Array(numUsers).fill(null).map(() => {
      return {
        name: faker.person.fullName(),
        role: faker.helpers.arrayElement([
          "doctor",
          "patient",
          "attendant",
          "admin",
        ]),
        email: faker.internet.email(),
        password: faker.internet.password(),
        phone: faker.phone.number(),
        dob: faker.date.past(),
        gender: faker.helpers.arrayElement(["Male", "Female", "Others"]),
      };
    });

    await UserModel.insertMany(usersData);

    console.log(`Inserted ${numUsers} fake user documents.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

insertFakeUsers();
