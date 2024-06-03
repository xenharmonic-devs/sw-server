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

const ORIGIN = process.env.ORIGIN as string;
if (!ORIGIN) {
  throw new Error('ORIGIN is undefined');
}
function response(body: BodyInit, init?: ResponseInit) {
  const res = new Response(body, init);
  res.headers.set('Access-Control-Allow-Origin', ORIGIN);
  return res;
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

    // Simple file-based system for storing scales.
    if (path === '/scale') {
      if (req.method !== 'POST') {
        return response('Method not allowed', {status: 405});
      }
      const data = await req.json();
      const envelope = cleanAndValidateEnvelope(data.envelope);
      envelope.requestIP = requestIP;
      envelope.xRealIP = xRealIP;
      envelope.xForwardedFor = xForwardedFor;
      envelope.xForwardedProto = xForwardedProto;

      const envelopeFilename = join(ENVELOPE_PATH, data.id + '.envelope.json');
      const envelopeFile = Bun.file(envelopeFilename);
      if (await envelopeFile.exists()) {
        return response('Scale already exists', {status: 409});
      }
      await Bun.write(envelopeFile, JSON.stringify(envelope));

      const payload = validatePayload(data.payload);
      // TODO: Generate preview image
      const filename = join(SCALE_PATH, data.id + '.json.gz');
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
      const {dir, base, ext} = parse(path);
      if (dir !== '/scale' || base.includes('..')) {
        return response('Bad scale path', {status: 400});
      }
      if (base.length > 255) {
        return response('Scale id too long', {status: 414});
      }
      if (ext !== '.gz') {
        return response('Not found', {status: 404});
      }
      const filename = join(SCALE_PATH, base);
      const file = Bun.file(filename);

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
    if (error.errno === -2 && error.syscall === 'open') {
      return response('Not found', {status: 404});
    }
    console.error(error);
    return response('Internal server error', {status: 500});
  },
});

console.log(`Listening on ${server.url}`);
