const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = '/tmp';
  const url = 'http://localhost:5173/mdm';

  const consoleLogs = [];
  const pageErrors = [];
  const networkFailures = [];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    try {
      const args = msg.args().map(a => (a._remoteObject && a._remoteObject.value) || a.toString());
      consoleLogs.push({ type: msg.type(), text: args.join(' '), location: msg.location() });
    } catch (e) {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(String(err && err.stack ? err.stack : err));
  });

  page.on('response', (res) => {
    const status = res.status();
    if (status >= 400) {
      networkFailures.push({ url: res.url(), status });
    }
  });

  page.on('requestfailed', (req) => {
    networkFailures.push({ url: req.url(), failureText: req.failure() && req.failure().errorText });
  });

  try {
    await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: 30000 });
  } catch (err) {
    pageErrors.push('Timeout/navigate error: ' + String(err));
  }

  // wait a bit for any lazy-load activity
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(outDir, 'mdm_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const consolePath = path.join(outDir, 'mdm_console.json');
  const errorsPath = path.join(outDir, 'mdm_pageerrors.json');
  const networkPath = path.join(outDir, 'mdm_network.json');

  fs.writeFileSync(consolePath, JSON.stringify(consoleLogs, null, 2));
  fs.writeFileSync(errorsPath, JSON.stringify(pageErrors, null, 2));
  fs.writeFileSync(networkPath, JSON.stringify(networkFailures, null, 2));

  console.log('done');
  console.log('screenshot:', screenshotPath);
  console.log('console log:', consolePath);
  console.log('page errors:', errorsPath);
  console.log('network failures:', networkPath);

  await browser.close();
  process.exit(0);
})();
