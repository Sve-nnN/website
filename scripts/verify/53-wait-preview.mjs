// Espera activa hasta que el preview responde 200 con x-robots-tag noindex.
// Uso: BASE_URL=https://dev.juan-tech.com WAIT_SECONDS=900 node scripts/verify/53-wait-preview.mjs
const base = process.env.BASE_URL
const waitSeconds = Number(process.env.WAIT_SECONDS ?? 600)

if (!base) {
  console.error('FAIL BASE_URL es obligatoria')
  process.exit(1)
}

const deadline = Date.now() + waitSeconds * 1000
let last = 'sin respuesta'

while (Date.now() < deadline) {
  try {
    const res = await fetch(`${base}/`, { redirect: 'manual' })
    const robots = res.headers.get('x-robots-tag') ?? ''
    last = `status ${res.status}, x-robots-tag "${robots}"`
    if (res.status === 200 && robots.toLowerCase().includes('noindex')) {
      console.log('OK')
      process.exit(0)
    }
  } catch (error) {
    last = `error de red: ${error instanceof Error ? error.message : String(error)}`
  }
  await new Promise((resolve) => setTimeout(resolve, 15_000))
}

console.error(`FAIL ${last}`)
process.exit(1)
