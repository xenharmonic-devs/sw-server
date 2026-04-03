import {Interval, evaluateExpression} from 'sonic-weave';
import {version} from './package.json';

const serverSonicWeaveVersion = evaluateExpression('VERSION', false) as string;

/**
 * Validates an input as a string and enforces a maximum length.
 *
 * @param str - Value to validate.
 * @param maxLength - Maximum allowed length in characters.
 * @returns The same string when validation succeeds.
 * @throws {Error} If the value is not a string or exceeds `maxLength`.
 */
function validateString(str: string, maxLength = 255) {
  if (typeof str !== 'string') {
    throw new Error('Not a string');
  }
  if (str.length > maxLength) {
    throw new Error('String too long');
  }
  return str;
}

/**
 * Validates an input as a number.
 *
 * @param n - Value to validate.
 * @returns The same number when validation succeeds.
 * @throws {Error} If the value is not a number.
 */
function validateNumber(n: number, fieldName: string) {
  if (typeof n !== 'number') {
    throw new Error(`${fieldName} is not a number`);
  }
  return n;
}

/**
 * Validates an input as a boolean.
 *
 * @param b - Value to validate.
 * @returns The same boolean when validation succeeds.
 * @throws {Error} If the value is not a boolean.
 */
function validateBoolean(b: boolean) {
  if (typeof b !== 'boolean') {
    throw new Error('Not a boolean');
  }
  return b;
}

/**
 * Validates an incoming scale payload before it is persisted.
 *
 * @param data - Parsed request payload object.
 * @returns `true` when validation succeeds.
 * @throws {Error} If any required field is missing or malformed.
 */
export function validatePayload(data: any) {
  // == Scale ==
  const scaleStore = data.scale;
  const scale = scaleStore.scale;
  if (scale.type !== 'ScaleWorkshopScale') {
    throw new Error('Invalid scale data');
  }
  for (const ratio of scale.intervalRatios) {
    validateNumber(ratio, 'scale.intervalRatios[i]');
  }
  for (const color of scaleStore.colors) {
    validateString(color);
  }
  for (const label of scaleStore.labels) {
    validateString(label);
  }
  validateNumber(scale.baseFrequency, 'scale.baseFrequency');
  validateNumber(scale.baseMidiNote, 'scale.baseMidiNote');
  validateString(scale.title, 4095);
  Interval.reviver('relativeIntervals', data.scale.relativeIntervals);
  validateString(scaleStore.name, 4095);
  validateString(scaleStore.sourceText, 65535);
  validateString(scaleStore.error);
  validateString(scaleStore.warning);
  validateString(scaleStore.keyboardMode);
  validateString(scaleStore.autoColors);
  validateString(scaleStore.pianoMode);
  validateString(scaleStore.accidentalColor);
  validateString(scaleStore.lowAccidentalColor);
  validateString(scaleStore.middleAccidentalColor);
  validateString(scaleStore.highAccidentalColor);
  validateNumber(scaleStore.userBaseFrequency, 'scaleStore.userBaseFrequency');
  validateBoolean(scaleStore.autoFrequency);
  validateNumber(
    scaleStore.isomorphicVertical,
    'scaleStore.isomorphicVertical',
  );
  validateNumber(
    scaleStore.isomorphicHorizontal,
    'scaleStore.isomorphicHorizontal',
  );
  validateNumber(scaleStore.equaveShift, 'scaleStore.equaveShift');
  validateNumber(scaleStore.degreeShift, 'scaleStore.degreeShift');
  if (scaleStore.latticeIntervals !== null) {
    Interval.reviver('latticeIntervals', scaleStore.latticeIntervals);
  }

  // == Audio ==
  const audio = data.audio;
  validateNumber(audio.mainVolume);
  if (audio.mainVolume < 0 || audio.mainVolume > 1) {
    throw new Error('Invalid main volume');
  }
  validateNumber(audio.sustainLevel);
  if (audio.sustainLevel < 0 || audio.sustainLevel > 1) {
    throw new Error('Invalid sustain level');
  }
  validateNumber(audio.pingPongGain);
  if (audio.pingPongGain < 0 || audio.pingPongGain > 1) {
    throw new Error('Invalid ping pong gain');
  }
  validateNumber(audio.pingPongFeedback);
  const fb = Math.abs(audio.pingPongFeedback);
  if (fb > 1) {
    throw new Error('Invalid ping pong feedback');
  }
  validateString(audio.waveform);
  validateString(audio.aperiodicWaveform);
  validateString(audio.synthType);
  validateNumber(audio.attackTime, 'audio.attackTime');
  validateNumber(audio.decayTime, 'audio.decayTime');
  validateNumber(audio.releaseTime, 'audio.releaseTime');
  validateNumber(audio.stackSize, 'audio.stackSize');
  validateNumber(audio.spread, 'audio.spread');
  if ('audioDelay' in audio) {
    // Legacy/test support
    validateNumber(audio.audioDelay, 'audio.audioDelay');
  }
  validateNumber(audio.pingPongDelayTime, 'audio.pingPongDelayTime');
  validateNumber(audio.pingPongSeparation, 'audio.pingPongSeparation');
  return true;
}

/**
 * Sanitizes and validates client envelope metadata.
 *
 * @param data - Raw envelope metadata supplied by the client.
 * @returns A server-augmented envelope object ready for storage.
 * @throws {Error} If envelope fields fail validation.
 */
export function cleanAndValidateEnvelope(data: any) {
  const envelope: any = {
    serverVersion: version,
    serverSonicWeaveVersion,
    serverMsSince1970: new Date().valueOf(),
  };
  envelope.clientVersion = validateString(data.version);
  envelope.clientSonicWeaveVersion = validateString(data.sonicWeaveVersion);
  envelope.clientMsSince1970 = validateNumber(
    data.msSince1970,
    'data.msSince1970',
  );
  if (data.navigator) {
    envelope.navigator = {};
    envelope.navigator.userAgent = validateString(
      data.navigator.userAgent,
      1023,
    );
    envelope.navigator.language = validateString(data.navigator.language);
    if (!Array.isArray(data.navigator.languages)) {
      throw new Error('Not an array');
    }
    envelope.navigator.languages = data.navigator.languages.map((l: string) =>
      validateString(l),
    );
  }
  if (data.userUUID) {
    envelope.userUUID = validateString(data.userUUID);
  }
  return envelope;
}
