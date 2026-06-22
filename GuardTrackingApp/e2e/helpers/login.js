const {
  email,
  password,
  clientEmail,
  clientPassword,
  adminEmail,
  adminPassword,
} = require('../env');

async function loginWithCredentials(userEmail, userPassword, homeTestId) {
  await waitFor(element(by.id('login-email-input')))
    .toBeVisible()
    .withTimeout(20000);

  await element(by.id('login-email-input')).replaceText(userEmail);
  await element(by.id('login-password-input')).replaceText(userPassword);
  await element(by.id('login-submit-button')).tap();

  await waitFor(element(by.id(homeTestId)))
    .toBeVisible()
    .withTimeout(30000);
}

async function loginAsGuard() {
  await loginWithCredentials(email, password, 'guard-home-screen');
}

async function loginAsClient() {
  await loginWithCredentials(clientEmail, clientPassword, 'client-dashboard-screen');
}

async function loginAsAdmin() {
  await loginWithCredentials(adminEmail, adminPassword, 'admin-dashboard-screen');
}

module.exports = { loginAsGuard, loginAsClient, loginAsAdmin, loginWithCredentials };