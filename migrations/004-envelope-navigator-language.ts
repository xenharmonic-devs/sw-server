import {readdirSync} from 'node:fs';
import {join} from 'node:path';

const ENVELOPE_PATH = process.env.ENVELOPE_PATH as string;

let migrated = 0;

for (const filename of readdirSync(ENVELOPE_PATH)) {
  if (!filename.endsWith('.envelope.json')) {
    continue;
  }

  const path = join(ENVELOPE_PATH, filename);
  const file = Bun.file(path);
  const envelope = await file.json();

  const hasRootLanguage = typeof envelope.language === 'string';
  const hasRootLanguages = Array.isArray(envelope.languages);
  if (!hasRootLanguage && !hasRootLanguages) {
    continue;
  }

  if (typeof envelope.navigator !== 'object' || envelope.navigator === null) {
    envelope.navigator = {};
  }

  if (hasRootLanguage && typeof envelope.navigator.language !== 'string') {
    envelope.navigator.language = envelope.language;
  }
  if (hasRootLanguages && !Array.isArray(envelope.navigator.languages)) {
    envelope.navigator.languages = envelope.languages;
  }

  delete envelope.language;
  delete envelope.languages;

  await Bun.write(file, JSON.stringify(envelope));
  migrated++;
  console.log('Migrated', filename);
}

console.log('Done. Migrated envelopes:', migrated);
