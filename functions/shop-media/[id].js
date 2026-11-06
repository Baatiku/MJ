import { serveMedia } from '../api/_shop-media.js';

export const onRequestGet = ({ request, env }) => serveMedia(request, env);
