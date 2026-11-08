import { handleCreate, handleList } from '../_lib/meetings.js';
import { makeDeps } from '../_lib/deps.js';

export const onRequestGet = ({ request, env }) => handleList(request, makeDeps(env));
export const onRequestPost = ({ request, env }) => handleCreate(request, makeDeps(env));
