// Standalone regression check for JsonLd.tsx's escapeForScriptTag() (no TS/app
// imports — the same 3-step replace chain is copied inline below so this can
// run with plain `node` outside the Next build). Confirms the escape chain
// neutralizes script-breakout payloads before they'd be injected via
// dangerouslySetInnerHTML. See src/components/JsonLd.tsx for the real
// implementation this mirrors.

function escapeForScriptTag(json) {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

const payload = {
  breakout: '</script><script>alert(1)</script>',
  imgOnerror: '<img src=x onerror=alert(1)>',
  ampersand: 'Tom & Jerry',
}

const json = JSON.stringify(payload)
const escaped = escapeForScriptTag(json)

const hasUnescapedLt = /</.test(escaped)
const hasUnescapedGt = />/.test(escaped)
const hasUnescapedAmp = /&(?!amp;)/.test(escaped) && /&(?!\\u0026)/.test(escaped.replace(/\\u0026/g, ''))

// Simpler direct check: after replace, none of the raw chars should survive.
const rawCharsSurvive = escaped.includes('<') || escaped.includes('>') || escaped.includes('&')

if (rawCharsSurvive) {
  console.error('FAIL: escapeForScriptTag left an unescaped <, >, or & in the output')
  console.error('Escaped output:', escaped)
  process.exit(1)
}

if (!escaped.includes('\\u003c') || !escaped.includes('\\u003e') || !escaped.includes('\\u0026')) {
  console.error('FAIL: expected unicode escape sequences not found in output')
  console.error('Escaped output:', escaped)
  process.exit(1)
}

console.log('PASS: escapeForScriptTag neutralizes </script>, <img onerror>, and bare & payloads')
