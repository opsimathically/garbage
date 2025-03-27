/* eslint-disable @typescript-eslint/no-unused-vars */
import test from 'node:test';
import assert from 'node:assert';

import { generateRandomGarbage } from '@src/garbage';

(async function () {
  test('Generate 1000 garbage things (could be anything really).', async function () {
    try {
      for (let idx = 0; idx < 1000; idx++) {
        generateRandomGarbage();
      }
    } catch (err) {
      assert.fail('Threw an error when this should never happen.');
    }
  });
})();
