import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const release = new URL('../release/', import.meta.url);
const html = await readFile(new URL('index.html', dist), 'utf8');
const scriptPath = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];
const stylePath = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)?.[1];
if (!scriptPath || !stylePath) throw new Error('Vite çıktısındaki JS veya CSS bulunamadı.');

const script = await readFile(new URL(`.${scriptPath}`, dist), 'utf8');
const style = await readFile(new URL(`.${stylePath}`, dist), 'utf8');
const bundled = html
  .replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/, `<script type="module">${script.replaceAll('</script', '<\\/script')}</script>`)
  .replace(/<link rel="stylesheet"[^>]*href="[^"]+"[^>]*>/, `<style>${style}</style>`);

await mkdir(release, { recursive: true });
const output = new URL('Bant_Tasinabilir.html', release);
await writeFile(output, bundled);
console.log(`Tek dosyalık HTML: ${fileURLToPath(output)}`);
