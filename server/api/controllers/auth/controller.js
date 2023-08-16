import userService from "../../services/user.service";
import l from "../../../common/logger";
import authenticationService from "../../services/authentication.service";
import ValidationService from "../../services/validation.service";

export class Controller {
  async signup(req, res, next) {
    try {
      let { name, email, password, phone, role, dob, gender } = req.body;

      email = ValidationService.normalizeEmail(email);
      const userDoc = await userService.signup(
        name,
        email,
        password,
        phone,
        role,
        dob,
        gender
      );
      const token = authenticationService.generateToken(userDoc._id);
      res.status(200).send(token);
    } catch (err) {
      l.error(err, "SIGNUP CONTROLLER ERROR");
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userDoc = await userService.login(email, password);
      const token = authenticationService.generateToken(userDoc._id);
      res.status(200).send(token);
    } catch (err) {
      l.error(err, "LOGIN CONTROLLER ERROR");
      next(err);
    }
  }

  async googleLogin(req, res, next) {
    try {
      const code = req.body.code;
      const userData = await userService.fetchGoogleData(code);

      const userDoc = await userService.googleLogin(userData.email);

      const token = authenticationService.generateToken(userDoc._id);
      return res.status(200).send(token);
    } catch (err) {
      l.error(err, "GOOGLE LOGIN CONTROLLER ERROR");
      next(err);
    }
  }
}
export default new Controller();
