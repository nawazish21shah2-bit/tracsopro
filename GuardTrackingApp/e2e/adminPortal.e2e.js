const { e2eGuardName } = require('./env');
const { loginAsAdmin } = require('./helpers/login');

describe('Admin portal flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  it('logs in as admin and views dashboard and user management', async () => {
    await loginAsAdmin();

    await waitFor(element(by.text('Active Sites')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.text('Management')).tap();

    await waitFor(element(by.id('admin-user-management-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.text('User Management')))
      .toBeVisible()
      .withTimeout(10000);

    await waitFor(element(by.text(e2eGuardName)))
      .toBeVisible()
      .withTimeout(15000);
  });
});
