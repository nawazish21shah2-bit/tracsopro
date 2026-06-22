describe('Login screen', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('shows email, password, and login button', async () => {
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(15000);
    await expect(element(by.id('login-password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('shows validation when submitting empty form', async () => {
    await element(by.id('login-submit-button')).tap();
    await expect(element(by.id('login-email-input'))).toBeVisible();
  });
});
