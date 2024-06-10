import {readdirSync, renameSync} from 'node:fs';
import {join} from 'node:path';

const SCALE_PATH = process.env.SCALE_PATH as string;
const ENVELOPE_PATH = process.env.ENVELOPE_PATH as string;

for (const filename of readdirSync(SCALE_PATH)) {
  if (filename.includes('-')) {
    const oldPath = join(SCALE_PATH, filename);
    const newPath = join(SCALE_PATH, filename.replaceAll('-', 'å'));
    renameSync(oldPath, newPath);
    console.log('Renamed', oldPath, 'to', newPath);
  }
}

for (const filename of readdirSync(ENVELOPE_PATH)) {
  if (filename.includes('-') || filename.includes('~')) {
    const oldPath = join(ENVELOPE_PATH, filename);
    const newPath = join(
      ENVELOPE_PATH,
      filename.replaceAll('-', 'å').replaceAll('~', '_')
    );
    renameSync(oldPath, newPath);
    console.log('Renamed', oldPath, 'to', newPath);
  }
}
