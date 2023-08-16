import userService from "../../services/user.service";
import l from "../../../common/logger";
import authenticationService from "../../services/authentication.service";
import ValidationService from "../../services/validation.service";

export class Controller {
  async getUser(req, res, next) {
    try {
      const userData = { ...req.user };
      delete userData.password;
      res.status(200).send(userData);
    } catch (err) {
      l.error(err, "LOGIN CONTROLLER ERROR");
      next(err);
    }
  }
}
export default new Controller();
