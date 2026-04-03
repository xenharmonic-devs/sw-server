import {expect, it, describe} from 'bun:test';
import {cleanAndValidateEnvelope, validatePayload} from '../data-processing';

import TEST_SCALE from './test-scale.json';
import TEST_SCALE_HARMONICS from './test-scale-harmonics.json';

describe('Payload validator', () => {
  it('validates the test scales', () => {
    expect(validatePayload(TEST_SCALE.payload)).toBe(true);
    expect(validatePayload(TEST_SCALE_HARMONICS.payload)).toBe(true);
  });

  it('allows NaN values for unbounded numeric fields', () => {
    const payload = structuredClone(TEST_SCALE.payload);
    payload.audio.attackTime = NaN;
    expect(validatePayload(payload)).toBe(true);
  });

  it('allows infinite values for unbounded numeric fields', () => {
    const payload = structuredClone(TEST_SCALE.payload);
    payload.audio.attackTime = Number.POSITIVE_INFINITY;
    expect(validatePayload(payload)).toBe(true);
  });
});

describe('Envelope validator', () => {
  it('cleans and validates the test envelope', () => {
    const envelope = cleanAndValidateEnvelope(TEST_SCALE.envelope);
    expect(envelope.navigator).toBeUndefined();
  });

  it('nests navigator language fields under navigator', () => {
    const envelope = cleanAndValidateEnvelope({
      ...TEST_SCALE.envelope,
      navigator: {
        userAgent: 'test-agent',
        language: 'en-US',
        languages: ['en-US', 'en'],
      },
    });
    expect(envelope.navigator.language).toBe('en-US');
    expect(envelope.navigator.languages).toEqual(['en-US', 'en']);
    expect(envelope.language).toBeUndefined();
    expect(envelope.languages).toBeUndefined();
  });
});
