import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

export function normalizePhoneNumber(input: string, defaultCountry?: CountryCode) {
  if (!input) return null;

  try {
    const phone = parsePhoneNumberFromString(input, defaultCountry ?? "ES");

    if (phone && phone.isValid()) {
      return phone.format("E.164");
    }

    return null;
  } catch {
    return null;
  }
}
