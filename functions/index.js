import { portfolio } from '../src/components/portfolio.js';
import { page } from './_catalog.js';

export async function onRequestGet({ request }) {
  return page(portfolio(new URL(request.url).origin));
}
