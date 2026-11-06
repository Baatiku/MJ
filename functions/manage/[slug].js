export function onRequestGet({ request, env }) {
  return env.ASSETS.fetch(new Request(new URL('/admin/', request.url), request));
}
