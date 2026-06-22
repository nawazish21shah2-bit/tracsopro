const { loginAsGuard } = require('./helpers/login');

describe('Login with E2E credentials', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  it('logs in as guard and reaches the home dashboard', async () => {
    await loginAsGuard();
  });
});
