import {readdirSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';

const SCALE_PATH = process.env.SCALE_PATH as string;

const files = readdirSync(SCALE_PATH);

for (const filename of files) {
  if (filename.endsWith('.json')) {
    const filepath = join(SCALE_PATH, filename);
    const file = Bun.file(filepath);
    const contents = await file.json();
    let source: string = contents.scale.sourceText;
    if (source.includes('//') || source.includes('/*')) {
      console.log('===', filename, '===');
      source = source.replaceAll('/*', '(*').replaceAll('*/', '*)');
      contents.scale.scale.sourceText = '';
      for (const line of source.split('\n')) {
        const parts = line.split('//');
        if (parts.length === 1) {
          contents.scale.scale.sourceText += line + '\n';
        } else {
          contents.scale.scale.sourceText +=
            parts[0] + '(*' + parts[1].concat(...parts.slice(2)) + ' *)\n';
        }
      }
      console.log(contents.scale.scale.sourceText);
    }
    unlinkSync(filepath);
    console.log('Deleted', filepath);
    const outfilepath = join(SCALE_PATH, filename.replaceAll('~', '_') + '.gz');
    const outfile = Bun.file(outfilepath);
    Bun.write(outfile, Bun.gzipSync(Buffer.from(JSON.stringify(contents))));
    console.log('Created', outfilepath);
  }
}
