import {readdirSync} from 'node:fs';
import {join} from 'node:path';

const SCALE_PATH = process.env.SCALE_PATH as string;

const files = readdirSync(SCALE_PATH);

for (const filename of files) {
  const filepath = join(SCALE_PATH, filename);
  const file = Bun.file(filepath);
  const unzipped = Bun.gunzipSync(await file.arrayBuffer());
  const contents = JSON.parse(Buffer.from(unzipped).toString('utf-8'));
  if (contents.scale.scale.sourceText) {
    console.log('Fixing', filename);
    contents.scale.sourceText = contents.scale.scale.sourceText;
    delete contents.scale.scale.sourceText;
  }
  Bun.write(file, Bun.gzipSync(Buffer.from(JSON.stringify(contents))));
}
