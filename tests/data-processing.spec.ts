import {expect, it, describe} from 'bun:test';
import {cleanAndValidateEnvelope, validatePayload} from '../data-processing';

import TEST_SCALE from './test-scale.json';

describe('Payload validator', () => {
  it('validates the test scale', () => {
    const data = validatePayload(TEST_SCALE.payload);
    // TODO: Return boolean instead.
    expect(data).toBe(TEST_SCALE.payload);
  });
});

describe('Envelope validator', () => {
  it('cleans and validates the test envelope', () => {
    expect(() => cleanAndValidateEnvelope(TEST_SCALE.envelope)).not.toThrow();
  });
});
