import {stat} from 'node:fs';
import {join, parse} from 'node:path';

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
    throw err;
  }
  if (!stats.isDirectory()) {
    throw new Error('SCALE_PATH must be a directory');
  }
});

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // Respond with text/html in development. Should not be accessible in production.
    if (path === '/') {
      const headers = new Headers();
      headers.append('Content-Type', 'text/html');
      return new Response(INDEX_BODY, {headers});
    }

    // Simple file-based system for storing scales.
    if (path === '/scale') {
      if (req.method !== 'POST') {
        return new Response('Method not allowed', {status: 405});
      }
      const data = await req.json();
      // TODO: Validate data
      // TODO: Generate preview image
      const filename = join(SCALE_PATH, data.name + '.json');
      const file = Bun.file(filename);
      if (await file.exists()) {
        return new Response('Scale already exists', {status: 409});
      }
      await Bun.write(file, JSON.stringify(data.payload));

      return new Response('Scale created', {status: 201});
    }

    // Read a stored scale. This should be bypassed in production.
    if (path.startsWith('/scale/')) {
      const {dir, base, ext} = parse(path);
      if (dir !== '/scale') {
        return new Response('Bad scale path', {status: 400});
      }
      if (base.length > 255) {
        return new Response('Scale name too long', {status: 414});
      }
      if (ext !== '.json') {
        return new Response('Not found', {status: 404});
      }
      const filename = join(SCALE_PATH, base);
      const file = Bun.file(filename);
      return new Response(file);
    }

    // We don't brew coffee here.
    if (path === '/coffee') {
      return new Response("I'm a teapot", {status: 418});
    }

    // 404s
    return new Response('Page not found', {status: 404});
  },
});

console.log(`Listening on ${server.url}`);
