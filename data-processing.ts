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
  const scale = data.scale;
  if (scale.type !== 'ScaleWorkshopScale') {
    return null;
  }
  for (const ratio of scale.intervalRatios) {
    validateNumber(ratio);
  }
  validateNumber(scale.baseFrequency);
  validateNumber(scale.baseMidiNote);
  validateString(scale.title, 4095);
  Interval.reviver('relativeIntervals', data.relativeIntervals);
  validateString(data.name, 4095);
  validateString(data.sourceText, 65535);
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
