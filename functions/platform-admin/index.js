export function onRequestGet({ request, env }) {
  return env.ASSETS.fetch(new Request(new URL('/manage/', request.url), request));
}
