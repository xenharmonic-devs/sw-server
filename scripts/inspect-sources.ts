import {readdirSync} from 'node:fs';
import {join} from 'node:path';

const SCALE_PATH = process.argv[2] ?? process.env.SCALE_PATH;
if (SCALE_PATH === undefined) {
  throw new Error('SCALE_PATH is undefined');
}

const decoder = new TextDecoder();

for (const filename of readdirSync(SCALE_PATH)) {
  const path = join(SCALE_PATH, filename);
  console.log('===', path, '===');
  const file = Bun.file(path);
  const buffer = await file.arrayBuffer();
  const arr = Bun.gunzipSync(buffer);
  const str = decoder.decode(arr);
  const data = JSON.parse(str);
  console.log(data.scale.sourceText);
}
