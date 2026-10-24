import test from 'node:test';
import assert from 'node:assert/strict';
import { BAND_OPTIONS, DEFAULT_BANDS, E96, calculate, parseTarget, searchResistors } from '../src/resistor.ts';

test('five-band colors calculate nominal value and inclusive tolerance limits', () => {
  const resistor = calculate(DEFAULT_BANDS);
  assert.equal(resistor.ohms, 47_000);
  assert.equal(resistor.tolerance, 1);
  assert.equal(resistor.min, 46_530);
  assert.equal(resistor.max, 47_470);
});

test('each band exposes only its valid color family', () => {
  assert.equal(BAND_OPTIONS[0].includes('black'), false);
  assert.equal(BAND_OPTIONS[3].includes('pink'), true);
  assert.equal(BAND_OPTIONS[4].includes('black'), false);
  assert.equal(BAND_OPTIONS[4].includes('gold'), true);
});

test('E24 search finds the standard 4.7 kΩ resistor whose range covers the target', () => {
  const matches = searchResistors(4_750, 'e24', 'gold');
  assert.equal(matches[0].ohms, 4_700);
  assert.deepEqual(matches[0].bands, ['yellow', 'violet', 'black', 'brown', 'gold']);
  assert.ok(matches[0].min <= 4_750 && matches[0].max >= 4_750);
});

test('all-values search can offer an exact value not present in E24', () => {
  assert.equal(searchResistors(4_730, 'e24', 'brown')[0].ohms, 4_700);
  assert.equal(searchResistors(4_730, 'all', 'brown')[0].ohms, 4_730);
});

test('E96 offers a five-band 4.75 kΩ value and no impossible four-band encoding', () => {
  assert.equal(E96.length, 96);
  assert.equal(new Set(E96).size, 96);
  assert.deepEqual(searchResistors(4_750, 'e96', 'brown')[0].bands, ['yellow', 'violet', 'green', 'brown', 'brown']);
  assert.equal(searchResistors(4_750, 'e96', 'brown', 4).length, 0);
});

test('target parser accepts Turkish decimal input and rejects invalid values', () => {
  assert.equal(parseTarget('4,7', 1_000), 4_700);
  assert.equal(parseTarget('0', 1), null);
  assert.equal(parseTarget('abc', 1), null);
});
