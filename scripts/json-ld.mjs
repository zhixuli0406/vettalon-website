// JSON is embedded in an HTML raw-text script context, where JSON escaping
// alone cannot prevent the HTML parser from recognizing a closing script tag.
export function serializeJsonLd(value) {
  const escapes = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => escapes[character]);
}
