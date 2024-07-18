import {Interval, evaluateExpression} from 'sonic-weave';
import {version} from './package.json';

const serverSonicWeaveVersion = evaluateExpression('VERSION', false) as string;

function validateString(str: string, maxLength = 255) {
  if (typeof str !== 'string') {
    throw new Error('Not a string');
  }
  if (str.length > maxLength) {
    throw new Error('String too long');
  }
  return str;
}

function validateNumber(n: number) {
  if (typeof n !== 'number') {
    throw new Error('Not a number (or even NaN)');
  }
  return n;
}

export function validatePayload(data: any) {
  // == Scale ==
  const scaleStore = data.scale;
  const scale = scaleStore.scale;
  if (scale.type !== 'ScaleWorkshopScale') {
    throw new Error('Invalid scale data');
  }
  for (const ratio of scale.intervalRatios) {
    validateNumber(ratio);
  }
  for (const color of scaleStore.colors) {
    validateString(color);
  }
  for (const label of scaleStore.labels) {
    validateString(label);
  }
  validateNumber(scale.baseFrequency);
  validateNumber(scale.baseMidiNote);
  validateString(scale.title, 4095);
  Interval.reviver('relativeIntervals', data.scale.relativeIntervals);
  validateString(scaleStore.name, 4095);
  validateString(scaleStore.sourceText, 65535);
  validateString(scaleStore.error);
  validateString(scaleStore.warning);
  validateString(scaleStore.keyboardMode);
  // TODO: Rest

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
  // TODO: Rest
  return data;
}

export function cleanAndValidateEnvelope(data: any) {
  const envelope: any = {
    serverVersion: version,
    serverSonicWeaveVersion,
    serverMsSince1970: new Date().valueOf(),
  };
  envelope.clientVersion = validateString(data.version);
  envelope.clientSonicWeaveVersion = validateString(data.sonicWeaveVersion);
  envelope.clientMsSince1970 = validateNumber(data.msSince1970);
  if (data.navigator) {
    envelope.navigator = {};
    envelope.navigator.userAgent = validateString(
      data.navigator.userAgent,
      1023
    );
    envelope.language = validateString(data.navigator.language);
    if (!Array.isArray(data.navigator.languages)) {
      throw new Error('Not an array');
    }
    envelope.languages = data.navigator.languages.map((l: string) =>
      validateString(l)
    );
  }
  if (data.userUUID) {
    envelope.userUUID = validateString(data.userUUID);
  }
  return envelope;
}
