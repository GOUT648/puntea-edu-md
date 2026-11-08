import { audiences, categories, postTypes, roles } from './taxonomy.mjs'

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
))
const e = escapeHtml
const root = '/comunitate/'
export const dateLabel = value => new Intl.DateTimeFormat('ro-MD', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'))
const label = { in_verificare: 'În verificare', publicat: 'Publicat', respins: 'Returnat pentru completare', retras: 'Retras' }
const sign = (page = 'cont/') => '/signin-with-chatgpt?return_to=' + encodeURIComponent(root + page)
const button = (href, text) => `<a class="button" href="${e(href)}">${e(text)}</a>`
const options = (values, value) => Object.entries(values).map(([key, name]) =>
  `<option value="${key}"${key === value ? ' selected' : ''}>${e(name)}</option>`
).join('')
const back = `<a class="back" href="${root}">← Comunitate</a>`

export function page(title, content, status = 200) {
  return new Response(`<!doctype html><html lang="ro-MD"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f5ec"><title>${e(title)} · Puntea Edu MD</title><link rel="icon" href="/assets/mark.svg"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/assets/app-192.png"><link rel="stylesheet" href="/assets/style.css?v=4"><script defer src="/assets/app.js?v=4"></script></head>
<body><a class="skip" href="#continut">Sari la conținut</a><header class="site-header wrap"><a class="brand" href="/"><img width="36" height="36" alt="" src="/assets/mark.svg"><span>Puntea Edu <small>MD</small></span></a><nav aria-label="Navigare principală"><a href="/#catalog">Caută</a><a href="${root}">Comunitate</a><a href="${root}cont/">Cont</a></nav></header>
<main id="continut" class="wrap subpage">${content}</main><footer class="site-footer wrap"><a href="/documentatie/#module">Parcurs</a><a href="/documentatie/#instalare">Instalează aplicația</a></footer></body></html>`, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'",
    },
  })
}

export const problem = (message, status) => page('Verifică datele', `${back}<h1>Verifică datele</h1><p role="alert">${e(message)}</p>`, status)
export const signIn = (returnPage = 'cont/') => page('Intră în cont', `${back}<h1>Intră în cont</h1><p>Alege un rol după autentificare. Poți citi toate materialele publicate din Comunitate.</p><a class="button" target="_top" href="${sign(returnPage)}">Intră cu ChatGPT</a>`)

export function feed(posts, filters, identity, hasMore) {
  const target = new URLSearchParams()
  if (filters.q) target.set('q', filters.q)
  if (filters.public) target.set('public', filters.public)
  if (filters.fisa) target.set('fisa', filters.fisa)
  const chips = Object.entries({ '': 'Toate', ...categories }).map(([value, text]) => {
    const query = new URLSearchParams(target)
    if (value) query.set('categorie', value)
    return `<a class="chip"${value === filters.categorie ? ' aria-current="true"' : ''} href="${root}${query.size ? '?' + e(query.toString()) : ''}">${e(text)}</a>`
  }).join('')
  const listing = posts.map(p => `<li><a class="offer" href="${root}p/${e(p.id)}/"><span class="offer-type">${e(categories[p.category])} · ${e(audiences[p.audience])}</span><strong>${e(p.title)}</strong><span class="offer-date">${p.deadline ? 'Înscriere până la ' + e(dateLabel(p.deadline)) : e(postTypes[p.kind])}</span></a></li>`).join('')
  if (filters.categorie) target.set('categorie', filters.categorie)
  const next = new URLSearchParams(target)
  next.set('pagina', filters.page + 1)
  const previous = new URLSearchParams(target)
  previous.set('pagina', filters.page - 1)
  const contextQuery = filters.fisa ? '?fisa=' + encodeURIComponent(filters.fisa) : ''
  return page('Comunitate', `<div class="section-head"><h1>Comunitate</h1>${identity ? button(root + 'scrie/' + contextQuery, 'Propune') : `<a class="button" target="_top" href="${sign('scrie/' + contextQuery)}">Intră în cont</a>`}</div>
  <p class="intro">Anunțuri, cercetări și cereri de sprijin verificate înainte de publicare.</p>
  <div class="handoff" aria-label="Comunități externe">
    <a href="/o/telegram-sigmoid/">Sigmoid AI</a>
    <a href="/o/telegram-matematica-md/">Matematica.md</a>
    <a href="/?categorie=comunitati&amp;q=telegram#catalog">Toate grupurile și canalele Telegram →</a>
  </div>
  <nav class="chips" aria-label="Categorii">${chips}</nav>
  <form class="community-filter" action="${root}" role="search">
    <input type="hidden" name="categorie" value="${e(filters.categorie)}">
    <input type="hidden" name="fisa" value="${e(filters.fisa)}">
    <label>Caută <input name="q" type="search" maxlength="80" value="${e(filters.q)}" placeholder="Titlu sau temă"></label>
    <label>Public <select name="public">${options({ '': 'Orice public', ...audiences }, filters.public)}</select></label>
    <button class="button">Aplică filtrele</button>
  </form>
  ${posts.length ? `<ul class="offers">${listing}</ul>` : '<p>Nu am găsit materiale publicate cu aceste filtre. Poți consulta <a href="/#catalog">catalogul editorial</a>.</p>'}
  <div class="handoff">${filters.page > 1 ? `<a href="?${e(previous.toString())}">← Pagina anterioară</a>` : ''}${hasMore ? `<a href="?${e(next.toString())}">Pagina următoare →</a>` : ''}</div>`)
}

export function account(profile, posts, moderator, waiting, next) {
  const list = posts.map(p => `<li><strong>${e(p.title)}</strong> · ${e(label[p.status])}
    ${p.decision_reason ? `<p>${e(p.decision_reason)}</p>` : ''}
    ${p.status === 'publicat' ? `<a href="${root}p/${e(p.id)}/">Vezi fișa</a>` : ''}
    ${['in_verificare', 'publicat'].includes(p.status) ? `<form action="${root}p/${e(p.id)}/retrage/" method="post"><button class="text-button">Retrage</button></form>` : ''}
    ${p.status === 'respins' ? `<a href="${root}scrie/?revizuire=${e(p.id)}">Completează și retrimite</a>` : ''}
  </li>`).join('')
  return page('Contul meu', `${back}<h1>Contul meu</h1>
  ${waiting ? '<p role="status">Propunerea este în verificare. Decizia apare aici.</p>' : ''}
  <section class="panel"><h2>Profil</h2><form class="community-filter" method="post" action="${root}cont/">
    <input type="hidden" name="next" value="${e(next)}">
    <label>Tip de cont <select name="role" required><option value="" disabled${profile ? '' : ' selected'}>Alege</option>${options(roles, profile?.role)}</select></label><button class="button">Salvează profilul</button>
  </form></section>
  ${profile ? `<div class="handoff">${button(root + 'scrie/', 'Propune un material')}${button(root + 'recomandari/', 'Recomandările mele')}${moderator ? button(root + 'moderare/', 'Moderare') : ''}<a target="_top" href="/signout-with-chatgpt?return_to=%2Fcomunitate%2F">Ieși din cont</a></div>
  <section class="panel"><h2>Materialele mele</h2>${list ? `<ul class="personal-list">${list}</ul>` : '<p>Aici vei vedea starea materialelor trimise.</p>'}</section>` : '<p>Tipul de cont rămâne privat.</p>'}`)
}

export function compose({ kind, context, contextTitle, values = {}, error = '', id, revision }) {
  const query = new URLSearchParams(context ? { fisa: context } : {})
  const tabs = revision ? '' : Object.entries(postTypes).map(([key, text]) => {
    query.set('tip', key)
    return `<a class="chip"${key === kind ? ' aria-current="true"' : ''} href="?${e(query.toString())}">${e(text)}</a>`
  }).join('')
  const input = (name, text, max, extra = '') => `<label>${text}<input name="${name}" maxlength="${max}" value="${e(values[name])}" ${extra}></label>`
  const area = (name, text, max) => `<label>${text}<textarea name="${name}" maxlength="${max}" rows="3" required>${e(values[name])}</textarea></label>`
  const days = (name, text) => `<label>${text}<input type="date" name="${name}" value="${e(values[name])}"></label>`
  const notice = error ? `<p role="alert">${e(error)}</p>` : ''
  return page('Propune un material', `${back}<h1>Propune un material</h1><nav class="chips" aria-label="Tipul materialului">${tabs}</nav>
  ${contextTitle ? `<p class="intro">Legat de ${e(contextTitle)}</p>` : ''}
  ${notice}<form class="entry-form panel" action="${root}scrie/" method="post">
    <input type="hidden" name="id" value="${e(id)}">
    <input type="hidden" name="revizuire" value="${revision ? 'da' : ''}">
    <input type="hidden" name="kind" value="${kind}">
    <input type="hidden" name="context_id" value="${e(context)}">
    ${input('title', 'Titlu', 120, 'required')}
    <div class="form-pair">
      ${kind === 'anunt' ? `<label>Categorie<select name="category" required>${options(Object.fromEntries(Object.entries(categories).filter(([key]) => key !== 'cercetari')), values.category)}</select></label>` : ''}
      <label>Public<select name="audience" required>${options(audiences, values.audience)}</select></label>
    </div>
    ${area('summary', kind === 'cercetare' ? 'Ce ai observat' : kind === 'sprijin' ? 'Cu ce ai nevoie de ajutor' : 'Ce oferi', 1200)}
    ${input('source_url', 'Link către sursa publică', 600, 'type="url" required placeholder="https://"')}
    ${kind === 'anunt' ? `${input('organizer', 'Organizator', 120, 'required')}<div class="form-pair">${days('deadline', 'Termen de înscriere, dacă este confirmat')}${days('event_date', 'Data activității, dacă este confirmată')}</div>` : ''}
    ${kind === 'cercetare' ? `${area('method', 'Cum ai strâns datele', 500)}${area('limits', 'Limitele observației', 350)}` : ''}
    <p class="muted">Folosește o sursă accesibilă public și elimină datele personale din text și din materialul asociat.</p>
    <button class="button">Trimite la verificare</button>
  </form>`, error ? 422 : 200)
}

export function postPage(post, context, viewer, related, sentReport) {
  const source = `<a class="button" href="${e(post.source_url)}" target="_blank" rel="noopener noreferrer">Deschide sursa ↗</a>`
  return page(post.title, `${back}<p class="eyebrow">${e(postTypes[post.kind])}</p><h1>${e(post.title)}</h1>
  <p class="intro">${e(post.summary)}</p>
  <div class="sheet"><div>
    <p>Public · ${e(audiences[post.audience])}</p>
    ${post.organizer ? `<p>Organizator · ${e(post.organizer)}</p>` : ''}
    ${post.kind === 'anunt' ? `<p>Înscriere · ${post.deadline ? e(dateLabel(post.deadline)) : '<a href="' + e(post.source_url) + '">Verifică termenul în sursă</a>'}</p>` : ''}
    ${post.event_date ? `<p>Activitate · ${e(dateLabel(post.event_date))}</p>` : ''}
    ${post.method ? `<p><strong>Metodă</strong><br>${e(post.method)}</p><p><strong>Limite</strong><br>${e(post.limits)}</p>` : ''}
  </div><div class="next">${source}${post.deadline || post.event_date ? `<a class="text-button" href="calendar.ics">Salvează în calendar</a>` : ''}</div></div>
  <div class="handoff">
    ${context ? `<a href="${e(context.href)}">${e(context.title)}</a>` : ''}
    <a href="/o/mentorat-inel/">Mentorat</a>
    <a href="${e(context?.practice ?? root + 'p/' + post.id + '/practica.txt')}">Fișa de practică</a>
    <a href="${root}scrie/?tip=cercetare&amp;fisa=${e(context ? post.context_id : 'p-' + post.id)}">Propune o observație</a>
  </div>
  ${related.length ? `<section><h2>Pe aceeași fișă</h2><ul>${related.map(p => `<li><a href="${root}p/${e(p.id)}/">${e(p.title)}</a></li>`).join('')}</ul></section>` : ''}
  ${sentReport ? '<p role="status">Semnalarea a fost înregistrată.</p>' : ''}
  <details class="archive"><summary>Semnalează o problemă</summary>
  ${viewer ? `<form class="entry-form" action="${root}p/${e(post.id)}/semnaleaza/" method="post"><label>Ce trebuie verificat?<textarea name="reason" maxlength="400" required rows="2"></textarea></label><button class="button">Trimite</button></form>` : `<p><a target="_top" href="${sign('p/' + post.id + '/')}">Intră în cont pentru a semnala</a></p>`}
  </details>`)
}

export function review(queue, canClaim) {
  const queueHtml = queue.map(p => `<article class="panel review-item"><h2>${e(p.title)}</h2>
    <p>${e(postTypes[p.kind])} · ${e(label[p.status])}</p><p>${e(p.summary)}</p>
    ${p.organizer ? `<p>Organizator · ${e(p.organizer)}</p>` : ''}
    ${p.deadline ? `<p>Înscriere · ${e(dateLabel(p.deadline))}</p>` : ''}
    ${p.event_date ? `<p>Activitate · ${e(dateLabel(p.event_date))}</p>` : ''}
    ${p.method ? `<p>${e(p.method)}</p><p>${e(p.limits)}</p>` : ''}
    ${p.report_reason ? `<p>Semnalare · ${e(p.report_reason)}</p>` : ''}
    <p><a href="${e(p.source_url)}" rel="noopener noreferrer" target="_blank">Verifică sursa ↗</a></p>
    <form class="entry-form" method="post" action="${root}moderare/${e(p.id)}/">
      <label>Motivul deciziei<textarea name="reason" maxlength="400" rows="2" required></textarea></label>
      <div class="handoff">${p.status === 'in_verificare' ? '<button class="button" name="decision" value="publicat">Publică</button><button class="text-button" name="decision" value="respins">Cere completare</button>' : '<button class="button" name="decision" value="retras">Retrage din catalog</button><button class="text-button" name="decision" value="rezolvat">Închide semnalarea</button>'}</div>
    </form></article>`).join('')
  return page('Moderare', `${back}<h1>Moderare</h1>
  ${canClaim ? '<form class="entry-form panel" method="post" action="/comunitate/moderare/activare/"><label>Codul de activare<input name="code" type="password" maxlength="80" required autocomplete="off"></label><button class="button">Activează moderarea</button></form>' : queueHtml || '<p>Coada de verificare este goală.</p>'}`)
}

export function recommendations(preferences, results) {
  const list = results.map(item => `<li class="panel"><a href="${e(item.href)}"><strong>${e(item.title)}</strong></a>
    <p class="muted">${e(categories[item.category])} · ${item.score}/100</p><ul>${item.reasons.map(reason => `<li>${e(reason)}</li>`).join('')}</ul></li>`).join('')
  return page('Recomandările mele', `${back}<h1>Recomandările mele</h1>
  <p class="intro">Spune ce cauți. Poți modifica sau goli preferințele oricând.</p>
  <form class="entry-form panel" action="${root}recomandari/" method="post">
    <label>Teme<input name="interests" maxlength="120" value="${e(preferences.interests)}" placeholder="matematică, evaluare formativă"></label>
    <label>Treaptă sau disciplină<input name="context" maxlength="70" value="${e(preferences.context)}" placeholder="gimnaziu"></label>
    <div class="form-pair"><label>Categorie<select name="category">${options({ '': 'Toate', ...categories }, preferences.category)}</select></label>
    <label>Publicul căutat<select name="audience">${options({ '': 'Oricare', ...audiences }, preferences.audience)}</select></label></div>
    <button class="button">Arată recomandările</button>
  </form>
  ${list ? `<h2>Rezultate</h2><ol class="personal-list">${list}</ol>` : '<p>Alege o temă sau un filtru pentru a vedea potrivirile.</p>'}`)
}
