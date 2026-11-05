export function page(markup, status = 200) {
  return new Response(markup, { status, headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  } });
}
