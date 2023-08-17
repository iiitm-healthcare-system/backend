import axios from "axios";
import url from "url";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import { Mongoose } from "mongoose";
import { ENVIROMENT_CONSTANTS } from "../../common/config";
import l from "../../common/logger";
import UserModel from "../../models/UserModel";
import validationService from "./validation.service";

class UserService {
  constructor() {
    this.client = new OAuth2Client(ENVIROMENT_CONSTANTS.GOOGLE_CLIENT_ID);
  }

  async signup(name, email, password, phone, role, dob, gender) {
    let userDoc = await UserModel.findOne({ email }).lean();

    if (userDoc) {
      if (!userDoc.password) {
        throw new Error("Please login using google");
      }
      const samePassword = await bcrypt.compare(password, userDoc.password);
      if (samePassword) {
        return userDoc;
      }
      throw new Error("User already exist with this email");
    }

    password = await bcrypt.hash(password, 10);
    try {
      const user = await UserModel.findOneAndUpdate(
        { email },
        {
          $set: {
            name,
            password,
            phone,
            role,
            dob,
            gender,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );
      return user;
    } catch (err) {
      l.error(err, "SIGNUP SERVICE ERROR");
    }
  }

  async login(email, password) {
    try {
      const user = await UserModel.findOne({ email });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.password) {
        throw new Error("Please login using google");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid Username or Password");
      }

      return user;
    } catch (err) {
      l.error(err, "LOGIN SERVICE ERROR");
      throw err;
    }
  }

  async googleLogin(email) {
    try {
      const user = await UserModel.findOne({ email });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (err) {
      l.error(err, "GOOGLE LOGIN SERVICE ERROR");
      throw err;
    }
  }

  async getuser(userId) {
    try {
      const user = await UserModel.findById(userId);
      return user;
    } catch (err) {
      l.error(err, "GET USER ERROR");
      throw err;
    }
  }

  async fetchGoogleData(code) {
    try {
      const urlEncodedBody = new url.URLSearchParams({
        code,
        client_id: ENVIROMENT_CONSTANTS.GOOGLE_CLIENT_ID,
        redirect_uri: ENVIROMENT_CONSTANTS.GOOGLE_REDIRECT_URI,
        client_secret: ENVIROMENT_CONSTANTS.GOOGLE_CLIENT_SECRET,
        grant_type: "authorization_code",
      });

      const { data } = await axios.post(
        `https://www.googleapis.com/oauth2/v4/token`,
        urlEncodedBody,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const response = await this.client.verifyIdToken({
        idToken: data.id_token,
        audience: ENVIROMENT_CONSTANTS.GOOGLE_CLIENT_ID,
      });

      const {
        email_verified,
        email,
        given_name,
        family_name,
        picture,
      } = response.payload;

      if (!email_verified) {
        throw new Error("Email not verified");
      }

      return {
        email,
        firstName: given_name,
        lastName: family_name,
        avatar: picture,
      };
    } catch (error) {
      l.error(error?.response?.data || error, "[FETCH GOOGLE DATA]");
      throw error;
    }
  }

  async searchPatients(query) {
    // search based on mail and name
    let regexExp = new RegExp(query.replace(/\s+/g, "\\s+"), "gi");

    try {
      const userData = await UserModel.find({
        $or: [
          {
            name: {
              $regex: regexExp,
            },
          },
          {
            email: {
              $regex: regexExp,
            },
          },
        ],
        // role: "patient",
      });
      return userData;
    } catch (err) {
      l.error(err, "GET USER ERROR");
      throw err;
    }
  }
}

export default new UserService();
