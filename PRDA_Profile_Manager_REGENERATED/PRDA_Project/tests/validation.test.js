const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateLogin, validateProfile } = require('../validation');

// Reuse a valid profile so each test only needs to change one field.
const good = {
  email: 'person@example.com',
  phone: '0821234567',
  dob: '2000-05-20'
};

// Profile validation should accept complete, correctly formatted details.
test('accepts valid profile', () => {
  assert.equal(validateProfile(good), null);
});

// Invalid values should return a message that identifies the problem.
test('rejects malformed email', () => {
  assert.match(validateProfile({ ...good, email: 'bad' }), /email/);
});

test('rejects alphabetic phone', () => {
  assert.match(validateProfile({ ...good, phone: '082ABC1234' }), /Phone/);
});

test('rejects impossible date', () => {
  assert.match(validateProfile({ ...good, dob: '2025-02-30' }), /birth/);
});

test('rejects future date', () => {
  assert.match(validateProfile({ ...good, dob: '2099-01-01' }), /birth/);
});

// Login validation requires both fields and accepts non-empty values.
test('rejects missing login password', () => {
  assert.match(
    validateLogin({ username: 'alice', password: '' }),
    /username and password/
  );
});

test('accepts login fields', () => {
  assert.equal(validateLogin({ username: 'alice', password: 'secret' }), null);
});
