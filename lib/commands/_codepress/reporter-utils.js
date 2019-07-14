const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const toString = sth => {
  if (typeof sth === 'string') return sth
  if (typeof sth === 'object') return JSON.stringify(sth)
  return '' + sth
}
const toError = err => {
  assert(err, 'err is required');

  let message = err.message;
  if (err.inspect) { // AssertionFailedError
    message = err.message = err.inspect()
  }
  message = toString(message)

  return {
    name: err.name,
    message,
    hash: hashString(message, err.stack),
    stack: err.stack,
    actual: err.actual,
    expected: err.expected,
    operator: err.operator
  }
}

const hashString = (...args) => {
  const str = args.join('-')
  const hash = crypto.createHash('sha1');
  hash.setEncoding('hex');
  hash.write(str);
  hash.end();
  return hash.read();
}

const isSnapshotStep = (step) => {
  if (step.name.startsWith('click') || step.name.startsWith('double')) return true;
  if (step.name.indexOf('tap') >= 0) return true;
  if (step.name.indexOf('see') >= 0) return true;
  // if (step.name.indexOf('waitForVisible') >= 0 || step.name.indexOf('waitInUrl')) return true;
  if (step.name.indexOf('swipe') >= 0) return true;
  // if (step.name.indexOf('grab') >= 0) return true;
  if (step.name.indexOf('fillField') >= 0) return true;
  if (step.name.indexOf('amOnPage') >= 0) return true;
  if (step.name.indexOf('saveScreenshot') >= 0) return true;
  return false;
}

const isScreenshotStep = (step) => {
  // if (step.name.indexOf('click') >= 0) return true;
  // if (step.name.indexOf('tap') >= 0) return true;
  // if (step.name.indexOf('amOnPage') >= 0) return true;
  // if (step.name.indexOf('refreshPage') >= 0) return true;
  if (step.name.indexOf('saveScreenshot') >= 0) return true;
  return false;
}

const takeSnapshot = async (helper, snapshotId, takeScreenshot = false) => {
  assert(helper, 'helper is required');

  const HelperName = helper.constructor.name;
  const StepFileName = '_step_screenshot.png';

  const [_, source, pageUrl, pageTitle, scrollPosition] = await Promise.all([
    takeScreenshot ? helper.saveScreenshot(StepFileName) : Promise.resolve(undefined),
    helper.grabSource(),
    helper.grabCurrentActivity ? await helper.grabCurrentActivity() : await helper.grabCurrentUrl(),
    helper.grabTitle(),
    helper.grabPageScrollPosition()
  ]);

  // TODO Add current state of 
  const snapshot = {
    id: snapshotId,
    screenshot: takeScreenshot ? fs.readFileSync(path.join(global.output_dir, StepFileName)) : undefined,
    scrollPosition,
    source,
    sourceContentType: HelperName === 'Appium' ? 'xml' : 'html',
    pageUrl,
    pageTitle
  };

  return snapshot;
}

module.exports = {
  toString,
  toError,
  hashString,
  isSnapshotStep,
  isScreenshotStep,
  takeSnapshot
}