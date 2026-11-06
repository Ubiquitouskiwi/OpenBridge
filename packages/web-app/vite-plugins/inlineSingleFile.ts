/**
 * Vite build plugin for the single-file local release (`npm run build:local`).
 *
 * Browsers refuse to load separate JavaScript module files from a page opened from disk
 * (file://), so the local download inlines the entry script and stylesheet into one HTML file
 * that works with a double-click, offline, and with no server. The build fails instead of
 * shipping a broken file if anything could not be inlined.
 */
import type { OutputAsset, OutputBundle, OutputChunk } from 'rollup';
import type { Plugin } from 'vite';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Keep inlined code from closing the surrounding <script> element early. */
function safeForScriptElement(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script');
}

function safeForStyleElement(css: string): string {
  return css.replace(/<\/style/gi, '<\\/style');
}

function inlineScript(html: string, chunk: OutputChunk): string {
  const tag = new RegExp(
    `<script\\b[^>]*\\bsrc="[^"]*${escapeRegExp(chunk.fileName)}"[^>]*></script>`,
  );
  if (!tag.test(html)) throw new Error(`No <script> tag found for ${chunk.fileName}`);
  // A replacer function keeps "$" sequences in the code from being read as patterns.
  return html.replace(
    tag,
    () => `<script type="module">${safeForScriptElement(chunk.code)}</script>`,
  );
}

function inlineStyle(html: string, asset: OutputAsset): string {
  const tag = new RegExp(`<link\\b[^>]*\\bhref="[^"]*${escapeRegExp(asset.fileName)}"[^>]*>`);
  if (!tag.test(html)) throw new Error(`No stylesheet <link> found for ${asset.fileName}`);
  return html.replace(tag, () => `<style>${safeForStyleElement(String(asset.source))}</style>`);
}

export function inlineSingleFile(outputName = 'OpenBridge.html'): Plugin {
  return {
    name: 'openbridge-inline-single-file',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle: OutputBundle) {
      const htmlAsset = Object.values(bundle).find(
        (o): o is OutputAsset => o.type === 'asset' && o.fileName.endsWith('.html'),
      );
      if (!htmlAsset) return this.error('No HTML entry found to inline into.');

      let html = String(htmlAsset.source);
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk') {
          if (!output.isEntry) {
            return this.error(`Chunk ${output.fileName} was not inlined (dynamic import split).`);
          }
          html = inlineScript(html, output);
          delete bundle[output.fileName];
        } else if (output.fileName.endsWith('.css')) {
          html = inlineStyle(html, output);
          delete bundle[output.fileName];
        }
      }

      const leftovers = Object.keys(bundle).filter((name) => name !== htmlAsset.fileName);
      if (leftovers.length > 0) {
        return this.error(`Files could not be inlined: ${leftovers.join(', ')}`);
      }
      delete bundle[htmlAsset.fileName];
      this.emitFile({ type: 'asset', fileName: outputName, source: html });
    },
  };
}
