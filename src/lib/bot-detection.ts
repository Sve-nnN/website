// [ASSUMED] (47-RESEARCH.md Assumption A1): ningún patrón de este repo
// respalda esta lista — es conocimiento general de industria, no una
// constante ya escrita para reusar (contact.ts solo tiene un honeypot de
// formulario, que no aplica a un GET sin formulario, ver Pitfall 2). Si algún
// crawler legítimo necesitara pasar por /go/, ajustar la lista es una
// decisión de Juan, no algo a resolver acá — además GO-03 ya lo desalienta
// vía `Disallow: /go`.
const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|curl|wget|python-requests|python-urllib|scrapy|headless|phantomjs|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|libwww-perl|node-fetch|axios|http-client/i

/**
 * Un User-Agent ausente o vacío cuenta como bot: un navegador real siempre
 * manda uno.
 */
export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim() === '') return true
  return BOT_USER_AGENT_PATTERN.test(userAgent)
}
