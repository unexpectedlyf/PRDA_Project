// Check the login fields before the server looks up an account.
function validateLogin({ username, password }) {
  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return 'Enter your username and password.';
  }

  return null;
}

// Check profile data on the server, even if the browser checked it too.
function validateProfile({ email, phone, dob }) {
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    return 'Enter a valid email address.';
  }
  if (typeof phone !== 'string' || !/^\d{7,15}$/.test(phone)) {
    return 'Phone number must contain 7–15 digits only.';
  }
  if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return 'Enter a valid date of birth.';
  }

  // Confirm the date exists, is not in the future, and is after 1900.
  const date = new Date(dob + 'T00:00:00Z');
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dob ||
    date > new Date() ||
    date.getUTCFullYear() < 1900
  ) {
    return 'Date of birth is invalid.';
  }

  return null;
}

module.exports = { validateLogin, validateProfile };
