import fs from 'node:fs';
import path from 'node:path';
import { ROOT, WEBSITE_ROOT } from '../src/lib/catalog.mjs';

const destination = path.join(WEBSITE_ROOT, 'public/archive/images');
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(ROOT, 'images'), destination, { recursive: true });