const { e2eSiteName } = require('./env');
const { loginAsClient } = require('./helpers/login');

describe('Client portal flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' },
    });
  });

  it('logs in as client and views dashboard and sites', async () => {
    await loginAsClient();

    await waitFor(element(by.text('Active Sites')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.text('Sites & Shifts')).tap();

    await waitFor(element(by.id('client-sites-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await waitFor(element(by.text(e2eSiteName)))
      .toBeVisible()
      .withTimeout(15000);
  });
});
