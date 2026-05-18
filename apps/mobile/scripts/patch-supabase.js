// Patches @supabase/supabase-js CJS/MJS bundles to replace the dynamic
// import() used for optional OpenTelemetry tracing with Promise.resolve(null).
// Dynamic import(variable) is not supported by Hermes (React Native's JS engine).
const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../node_modules/@supabase/supabase-js/dist/index.cjs'),
  path.resolve(__dirname, '../../..', 'node_modules/@supabase/supabase-js/dist/index.cjs'),
  path.resolve(__dirname, '../node_modules/@supabase/supabase-js/dist/index.mjs'),
  path.resolve(__dirname, '../../..', 'node_modules/@supabase/supabase-js/dist/index.mjs'),
];

const pattern = /function loadOtel\(\) \{\n\tif \(otelModulePromise === null\) otelModulePromise = import\(\n\t\t\/\* webpackIgnore: true \*\/\n\t\t\/\* @vite-ignore \*\/\n\t\tOTEL_PKG\n\)\.catch\(\(\) => null\);\n\treturn otelModulePromise;\n\}/;
const replacement = 'function loadOtel() {\n\tif (otelModulePromise === null) otelModulePromise = Promise.resolve(null);\n\treturn otelModulePromise;\n}';

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import(')) {
    console.log(`Already patched: ${file}`);
    continue;
  }
  const patched = content.replace(pattern, replacement);
  if (patched === content) {
    console.warn(`Pattern not matched in: ${file}`);
    continue;
  }
  fs.writeFileSync(file, patched, 'utf8');
  console.log(`Patched: ${file}`);
}
