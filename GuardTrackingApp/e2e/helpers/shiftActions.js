const { siteLatitude, siteLongitude } = require('../env');

async function dismissOkAlert() {
  try {
    await waitFor(element(by.text('OK')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('OK')).tap();
  } catch {
    // Alert may already be dismissed or not shown in this build.
  }
}

async function checkInAtSite(
  latitude = siteLatitude,
  longitude = siteLongitude
) {
  await waitFor(element(by.id('guard-shift-action-button')))
    .toBeVisible()
    .withTimeout(20000);

  await device.setLocation(latitude, longitude);
  await element(by.id('guard-shift-action-button')).tap();

  await waitFor(element(by.text('Check Out')))
    .toBeVisible()
    .withTimeout(30000);

  await dismissOkAlert();
}

async function checkOutAtSite(
  latitude = siteLatitude,
  longitude = siteLongitude
) {
  await waitFor(element(by.text('Check Out')))
    .toBeVisible()
    .withTimeout(10000);

  await device.setLocation(latitude, longitude);
  await element(by.id('guard-shift-action-button')).tap();

  // Confirm native alert ("Are you sure you want to check out?")
  await waitFor(element(by.text('Check Out')).atIndex(1))
    .toBeVisible()
    .withTimeout(5000);
  await element(by.text('Check Out')).atIndex(1).tap();

  await waitFor(element(by.text('OK')))
    .toBeVisible()
    .withTimeout(30000);
  await element(by.text('OK')).tap();
}

module.exports = { checkInAtSite, checkOutAtSite, dismissOkAlert };
