import {stat} from 'node:fs';
import {join, parse} from 'node:path';
import {cleanAndValidateEnvelope, validatePayload} from './data-processing';

const INDEX_BODY = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scale Workshop server</title>
  </head>
  <body>
    <h1>Scale Workshop server</h1>
    <div>
      <p>This is the backend component of Scale Workshop and it seems to be working.</p>
      <p>If you can see this message in production it indicates a server misconfiguration! Contact maintainers at once!</p>
    </div>
  </body>
</html>
`;

const SCALE_PATH = process.env.SCALE_PATH;
if (SCALE_PATH === undefined) {
  throw new Error('SCALE_PATH is undefined');
}
stat(SCALE_PATH, (err, stats) => {
  if (err) {
    console.warn('SCALE_PATH stat failed');
    throw err;
  }
  if (!stats.isDirectory()) {
    throw new Error('SCALE_PATH must be a directory');
  }
});

const ENVELOPE_PATH = process.env.ENVELOPE_PATH;
if (ENVELOPE_PATH === undefined) {
  throw new Error('ENVELOPE_PATH is undefined');
}
stat(ENVELOPE_PATH, (err, stats) => {
  if (err) {
    console.warn('ENVELOPE_PATH stat failed');
    throw err;
  }
  if (!stats.isDirectory()) {
    throw new Error('ENVELOPE_PATH must be a directory');
  }
});

const STATISTICS_PATH = process.env.STATISTICS_PATH;
if (STATISTICS_PATH === undefined) {
  throw new Error('STATISTICS_PATH is undefined');
}
stat(STATISTICS_PATH, (err, stats) => {
  if (err) {
    console.warn('STATISTICS_PATH stat failed');
    throw err;
  }
  if (!stats.isDirectory()) {
    throw new Error('STATISTICS_PATH must be a directory');
  }
});

const ORIGIN = process.env.ORIGIN as string;
if (!ORIGIN) {
  throw new Error('ORIGIN is undefined');
}
function response(body: BodyInit, init?: ResponseInit) {
  const res = new Response(body, init);
  res.headers.set('Access-Control-Allow-Origin', ORIGIN);
  return res;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {month: '2-digit'});
function statisticsFilename() {
  const date = new Date();
  const month = monthFormatter.format(date);
  return join(STATISTICS_PATH!, `stats_${date.getFullYear()}_${month}.json`);
}
function emptyStatistic() {
  return {
    error: 0,
    'scale GET': 0,
    'scale POST': 0,
    'scale GET by id': {} as Record<string, number>,
  };
}
let statistics = emptyStatistic();
let statstisticsFile = Bun.file(statisticsFilename());
if (await statstisticsFile.exists()) {
  console.log("Loading this month's statistics");
  statistics = await statstisticsFile.json();
}

async function checkStatistics() {
  if (statstisticsFile.name !== statisticsFilename()) {
    console.log("Committing last month's statistics");
    await Bun.write(statstisticsFile, JSON.stringify(statistics));
    statistics = emptyStatistic();
    statstisticsFile = Bun.file(statisticsFilename());
  }
}

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;
    console.log(req.method, path);
    const requestIP = server.requestIP(req);
    const xRealIP = req.headers.get('X-Real-IP');
    const xForwardedFor = req.headers.get('X-Forwarded-For');
    const xForwardedProto = req.headers.get('X-Forwarded-Proto');

    // Respond with text/html in development. Should not be accessible in production.
    if (path === '/') {
      const res = response(INDEX_BODY);
      res.headers.append('Content-Type', 'text/html');
      return res;
    }

    if (path === '/kill') {
      console.warn('Kill request received');
      await Bun.write(statstisticsFile, JSON.stringify(statistics));
      server.stop();
      const res = response('killed\n');
      res.headers.append('Content-Type', 'text/plain');
      return res;
    }

    // Simple file-based system for storing scales.
    if (path === '/scale') {
      if (req.method !== 'POST') {
        return response('Method not allowed', {status: 405});
      }
      await checkStatistics();
      statistics['scale POST']++;
      const data = await req.json();
      // Convert dashes to something more bash friendly.
      const id = (data.id as string).replaceAll('-', 'å');
      const envelope = cleanAndValidateEnvelope(data.envelope);
      envelope.requestIP = requestIP;
      envelope.xRealIP = xRealIP;
      envelope.xForwardedFor = xForwardedFor;
      envelope.xForwardedProto = xForwardedProto;

      const envelopeFilename = join(ENVELOPE_PATH, id + '.envelope.json');
      const envelopeFile = Bun.file(envelopeFilename);
      if (await envelopeFile.exists()) {
        return response('Scale already exists', {status: 409});
      }
      await Bun.write(envelopeFile, JSON.stringify(envelope));

      const payload = validatePayload(data.payload);
      // TODO: Generate preview image
      const filename = join(SCALE_PATH, id + '.json.gz');
      const file = Bun.file(filename);
      if (await file.exists()) {
        return response('Scale already exists', {status: 409});
      }
      const buffer = Buffer.from(JSON.stringify(payload));
      await Bun.write(file, Bun.gzipSync(buffer));

      return response('Scale created', {status: 201});
    }

    // Read a stored scale. This should be bypassed in production.
    if (path.startsWith('/scale/')) {
      // Total stats include bad requests
      await checkStatistics();
      statistics['scale GET']++;

      // Convert dashes to something more bash friendly.
      const {dir, base, ext} = parse(path.replaceAll('-', 'å'));
      if (dir !== '/scale' || base.includes('..')) {
        return response('Bad scale path', {status: 400});
      }
      if (ext) {
        return response('Extensions have been depracated', {status: 400});
      }
      if (base.length > 255) {
        return response('Scale id too long', {status: 414});
      }
      const filename = join(SCALE_PATH, base + '.json.gz');
      const file = Bun.file(filename);

      const count = statistics['scale GET by id'][base] ?? 0;
      statistics['scale GET by id'][base] = count + 1;

      const accept = req.headers.get('Accept-Encoding');
      if (!accept || !accept.split(',').includes('gzip')) {
        const buffer = await file.arrayBuffer();
        return response(Bun.gunzipSync(buffer));
      }

      // 404 done in error handler
      const res = response(file);

      res.headers.set('Content-Encoding', 'gzip');
      return res;
    }

    // We don't brew coffee here.
    if (path === '/coffee') {
      return response("I'm a teapot", {status: 418});
    }

    // 404s
    return response('Page not found', {status: 404});
  },
  error(error) {
    statistics.error++;
    if (error.errno === -2 && error.syscall === 'open') {
      return response('Not found', {status: 404});
    }
    console.error(error);
    return response('Internal server error', {status: 500});
  },
});

console.log(`Listening on ${server.url}`);
