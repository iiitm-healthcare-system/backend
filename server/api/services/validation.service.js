import validator from "validator";

class ValidationService {
  normalizeEmail(email) {
    return validator.normalizeEmail(email, {
      all_lowercase: true,
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: true,
      gmail_convert_googlemaildotcom: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: true,
      yahoo_lowercase: true,
      yahoo_remove_subaddress: true,
      icloud_lowercase: true,
      icloud_remove_subaddress: true,
    });
  }
}

export default new ValidationService();
