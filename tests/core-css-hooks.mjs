// Node cannot import .css files, but the app does (Vite handles them in the browser).
// This hook makes every .css import an empty module while tests run. Owner: AI-1
export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return { format: 'module', source: 'export default "";', shortCircuit: true };
  }
  return nextLoad(url, context);
}
