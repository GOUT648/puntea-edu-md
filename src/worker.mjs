import { assets, editions, opportunities } from './assets.mjs'
import { account, compose, feed, postPage, problem, recommendations, review, signIn } from './community.mjs'
import { audiences, categories, fold, postTypes, roles } from './taxonomy.mjs'
import { rankOpportunities } from './recommendations.mjs'

const root = '/comunitate/'
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/
const postPath = /^\/comunitate\/p\/([0-9a-f-]{36})\/(?:(calendar\.ics|practica\.txt)|(retrage|semnaleaza)\/)?$/
const typeFor = { html: 'text/html', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', txt: 'text/plain', xml: 'application/xml' }
const publicFields = 'id, kind, category, audience, title, summary, source_url, context_id, organizer, deadline, event_date, method, limits, status'
const redirect = location => new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store' } })
const statement = (db, sql, ...values) => db.prepare(sql).bind(...values)
const all = async (db, sql, ...values) => (await statement(db, sql, ...values).all()).results
const userId = request => request.headers.get('oai-authenticated-user-id')?.trim()
const valueOf = (value, options, fallback) => Object.hasOwn(options, value) ? value : fallback

class InputError extends Error {}

function field(values, key, name, min, max) {
  const value = String(values[key] ?? '').trim()
  if (value.length < min || value.length > max) throw new InputError('Verifică lungimea câmpului „' + name + '”.')
  return value || null
}

function validDate(values, key, name) {
  const value = field(values, key, name, 0, 10)
  if (!value) return null
  const date = new Date(value + 'T12:00:00Z')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(+date) || date.toISOString().slice(0, 10) !== value) {
    throw new InputError('Alege o dată validă pentru „' + name + '”.')
  }
  return value
}

function publicUrl(values) {
  const raw = field(values, 'source_url', 'Link către sursa publică', 8, 600)
  let url
  try { url = new URL(raw) } catch { throw new InputError('Adaugă un link public complet, începând cu https://.') }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.') ||
      /(?:^|\.)localhost$|\.local$|^[\d.]+$/.test(url.hostname)) {
    throw new InputError('Adaugă un link HTTPS către o sursă publică.')
  }
  return url.href
}

async function formValues(request, url) {
  if (request.headers.get('Origin') !== url.origin) throw new InputError('Deschide formularul direct din Puntea Edu.')
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) throw new InputError('Folosește formularul Puntea Edu.')
  if (Number(request.headers.get('Content-Length')) > 16000) throw new InputError('Formularul depășește limita de date.')
  const reader = request.body?.getReader()
  if (!reader) throw new InputError('Formularul este gol.')
  const decoder = new TextDecoder()
  let size = 0
  let encoded = ''
  for (;;) {
    const chunk = await reader.read()
    if (chunk.done) break
    size += chunk.value.byteLength
    if (size > 16000) {
      await reader.cancel()
      throw new InputError('Formularul depășește limita de date.')
    }
    encoded += decoder.decode(chunk.value, { stream: true })
  }
  return Object.fromEntries(new URLSearchParams(encoded + decoder.decode()))
}

async function contextFor(db, id) {
  if (Object.hasOwn(editions, id)) return editions[id]
  if (!id?.startsWith('p-') || !uuid.test(id.slice(2))) return null
  const post = await statement(db, 'SELECT id, title FROM posts WHERE id = ? AND status = ?', id.slice(2), 'publicat').first()
  return post ? { title: post.title, href: root + 'p/' + post.id + '/', practice: root + 'p/' + post.id + '/practica.txt' } : null
}

function postData(values, kind, context) {
  const category = kind === 'cercetare' ? 'cercetari' : kind === 'sprijin' ? 'mentorat' : valueOf(values.category, categories, null)
  if (!category || (kind === 'anunt' && category === 'cercetari')) throw new InputError('Alege o categorie potrivită anunțului.')
  if (!Object.hasOwn(audiences, values.audience)) throw new InputError('Alege publicul materialului.')
  const title = field(values, 'title', 'Titlu', 5, 120)
  const summary = field(values, 'summary', 'Descriere', 15, 1200)
  const source = publicUrl(values)
  const organizer = kind === 'anunt' ? field(values, 'organizer', 'Organizator', 2, 120) : null
  const deadline = kind === 'anunt' ? validDate(values, 'deadline', 'Termen de înscriere') : null
  const eventDate = kind === 'anunt' ? validDate(values, 'event_date', 'Data activității') : null
  if (deadline && eventDate && deadline > eventDate) throw new InputError('Termenul de înscriere trebuie să fie înaintea activității sau în aceeași zi.')
  const method = kind === 'cercetare' ? field(values, 'method', 'Metodă', 8, 500) : null
  const limits = kind === 'cercetare' ? field(values, 'limits', 'Limite', 5, 350) : null
  return [kind, category, values.audience, title, summary, source, context, organizer, deadline, eventDate, method, limits]
}

async function listPosts(db, query, id) {
  const filters = {
    q: (query.get('q') || '').trim().slice(0, 80),
    categorie: valueOf(query.get('categorie'), categories, ''),
    public: valueOf(query.get('public'), audiences, ''),
    fisa: (query.get('fisa') || '').slice(0, 50),
    page: Math.max(1, Math.min(10000, Number.parseInt(query.get('pagina'), 10) || 1)),
  }
  if (filters.fisa && !await contextFor(db, filters.fisa)) filters.fisa = ''
  const clauses = ["status = 'publicat'"]
  const values = []
  if (filters.categorie) { clauses.push('category = ?'); values.push(filters.categorie) }
  if (filters.public) { clauses.push("audience IN (?, 'toti')"); values.push(filters.public) }
  if (filters.fisa) { clauses.push('context_id = ?'); values.push(filters.fisa) }
  for (const term of fold(filters.q).split(/\s+/).filter(Boolean)) {
    clauses.push('search_text LIKE ? ESCAPE ?')
    values.push('%' + term.replace(/[\\_%]/g, '\\$&') + '%', '\\')
  }
  const posts = await all(db, 'SELECT ' + publicFields + ' FROM posts WHERE ' + clauses.join(' AND ') +
    ' ORDER BY published_at DESC, id DESC LIMIT 21 OFFSET ?', ...values, (filters.page - 1) * 20)
  return { posts: posts.slice(0, 20), filters, hasMore: posts.length > 20 }
}

async function composePost(db, request, query, id) {
  const profile = await statement(db, 'SELECT role FROM profiles WHERE user_id = ?', id).first()
  if (!profile) return redirect(root + 'cont/?next=' + encodeURIComponent(root + 'scrie/' + new URL(request.url).search))
  const submitted = request.method === 'POST'
  const values = submitted ? await formValues(request, new URL(request.url)) : {}
  const revisionId = submitted ? (values.revizuire === 'da' ? values.id : '') : query.get('revizuire')
  let revision = null
  if (revisionId) {
    revision = await statement(db, "SELECT * FROM posts WHERE id = ? AND author_id = ? AND status = 'respins'", revisionId, id).first()
    if (!revision) return problem('Materialul nu poate fi completat din acest cont.', 404)
  }
  const kind = revision?.kind ?? valueOf(submitted ? values.kind : query.get('tip'), postTypes, 'anunt')
  const contextId = submitted ? values.context_id : revision?.context_id || query.get('fisa')
  const context = await contextFor(db, contextId)
  const render = { kind, context: context ? contextId : null, contextTitle: context?.title, values: submitted ? values : revision || {}, id: revision?.id ?? (submitted ? values.id : crypto.randomUUID()), revision }
  if (!submitted) return compose(render)
  if (!uuid.test(values.id || '')) return problem('Redeschide formularul și încearcă din nou.', 400)
  let fields
  try {
    if (contextId && !context) throw new InputError('Fișa asociată nu mai este disponibilă.')
    fields = postData(values, kind, render.context)
  } catch (error) {
    if (!(error instanceof InputError)) throw error
    return compose({ ...render, error: error.message })
  }
  const search = fold(fields.slice(3, 5).join(' ') + ' ' + (fields[7] || ''))
  if (revision) {
    const result = await statement(db, `UPDATE posts SET kind=?, category=?, audience=?, title=?, summary=?, source_url=?, context_id=?,
      organizer=?, deadline=?, event_date=?, method=?, limits=?, search_text=?, status='in_verificare', decision_by=?,
      decision_at=CURRENT_TIMESTAMP, decision_reason='Autorul a retrimis materialul.'
      WHERE id=? AND author_id=? AND status='respins'
      AND (SELECT COUNT(*) FROM posts WHERE author_id=? AND status='in_verificare') < 5`, ...fields, search, id, revision.id, id, id).run()
    if (!result.meta.changes) return compose({ ...render, error: 'Așteaptă verificarea unei propuneri înainte de a retrimite.' })
  } else {
    const result = await statement(db, `INSERT OR IGNORE INTO posts (id,author_id,kind,category,audience,title,summary,source_url,
      context_id,organizer,deadline,event_date,method,limits,search_text)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      WHERE (SELECT COUNT(*) FROM posts WHERE author_id=? AND status='in_verificare') < 5
      AND (SELECT COUNT(*) FROM posts WHERE author_id=? AND created_at >= datetime('now', '-1 day')) < 12`,
    values.id, id, ...fields, search, id, id).run()
    if (!result.meta.changes && !await statement(db, 'SELECT id FROM posts WHERE id=? AND author_id=?', values.id, id).first()) {
      return compose({ ...render, error: 'Ai atins limita propunerilor. Așteaptă verificarea sau revino mâine.' })
    }
  }
  return redirect(root + 'cont/?trimis=1')
}

function calendar(post) {
  const escape = text => text.replace(/\\/g, '\\\\').replace(/[\r\n]+/g, '\\n').replace(/([,;])/g, '\\$1')
  const compact = date => date.replaceAll('-', '')
  const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')
  const dates = [[post.deadline, 'Înscriere'], [post.event_date, 'Activitate']]
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Puntea Edu MD//Comunitate//RO']
  for (const [date, type] of dates) {
    if (!date) continue
    lines.push('BEGIN:VEVENT', 'UID:' + post.id + '-' + compact(date) + '-' + type + '@puntea-edu-md',
      'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + compact(date), 'SUMMARY:' + escape(type + ' · ' + post.title), 'END:VEVENT')
  }
  return new Response([...lines, 'END:VCALENDAR', ''].join('\r\n'), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="puntea-calendar.ics"', 'Cache-Control': 'no-store' },
  })
}

async function publicPost(db, id, tail, request, url, visitor) {
  const href = root + 'p/' + id + '/'
  if (request.method === 'POST' && tail) {
    if (!visitor) return problem('Intră în cont pentru această acțiune.', 401)
    const values = await formValues(request, url)
    if (tail === 'retrage') {
      const result = await statement(db, `UPDATE posts SET status='retras', decision_by=?, decision_at=CURRENT_TIMESTAMP,
        decision_reason='Autorul a retras materialul.' WHERE id=? AND author_id=? AND status IN ('in_verificare','publicat')`, visitor, id, visitor).run()
      return result.meta.changes ? redirect(root + 'cont/') : problem('Materialul nu poate fi retras din acest cont.', 404)
    }
    const reason = field(values, 'reason', 'Motiv', 8, 400)
    const result = await statement(db, `INSERT OR IGNORE INTO reports (post_id,reporter_id,reason)
      SELECT id,?,? FROM posts WHERE id=? AND status='publicat'
      AND (SELECT COUNT(*) FROM reports WHERE reporter_id=? AND created_at >= datetime('now','-1 day')) < 8`, visitor, reason, id, visitor).run()
    if (!result.meta.changes && !await statement(db, 'SELECT post_id FROM reports WHERE post_id=? AND reporter_id=?', id, visitor).first()) {
      return problem('Semnalarea nu poate fi trimisă acum.', 422)
    }
    return redirect(href + '?semnalat=1')
  }
  if (request.method !== 'GET' || ['retrage', 'semnaleaza'].includes(tail)) return problem('Acțiunea nu este disponibilă.', 405)
  const post = await statement(db, 'SELECT ' + publicFields + " FROM posts WHERE id=? AND status='publicat'", id).first()
  if (!post) return problem('Materialul nu este disponibil public.', 404)
  if (tail === 'calendar.ics') return post.deadline || post.event_date ? calendar(post) : problem('Fișa nu are o dată publicată.', 404)
  if (tail === 'practica.txt') {
    const worksheet = [post.title, 'Ediție: p-' + post.id, 'Sursă: ' + post.source_url, '', 'Ziua 7 · Ce am încercat?', 'Ziua 14 · Ce am observat?', 'Ziua 30 · Ce schimb?', '', 'Folosește observații agregate, fără date personale.', ''].join('\n')
    return new Response(worksheet, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="fisa-de-practica.txt"', 'Cache-Control': 'no-store' } })
  }
  const context = await contextFor(db, post.context_id)
  const related = await all(db, `SELECT id,title FROM posts WHERE status='publicat' AND id<>?
    AND (context_id=? OR (? IS NOT NULL AND context_id=?)) ORDER BY published_at DESC LIMIT 8`, id, 'p-' + id, post.context_id, post.context_id)
  return postPage(post, context, visitor, related, url.searchParams.get('semnalat') === '1')
}

async function moderatorRoute(db, request, url, id, env) {
  if (!id) return request.method === 'GET' ? signIn('moderare/') : problem('Intră în cont.', 401)
  const seat = await statement(db, 'SELECT user_id FROM moderators WHERE seat=1').first()
  if (!seat && env.PUNTEA_MODERATOR_HASH) {
    if (request.method === 'GET' && url.pathname === root + 'moderare/') return review([], true)
    if (request.method === 'POST' && url.pathname === root + 'moderare/activare/') {
      const values = await formValues(request, url)
      const code = field(values, 'code', 'Codul de activare', 32, 80)
      const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)))
      const hash = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
      if (hash !== env.PUNTEA_MODERATOR_HASH) return problem('Codul de activare nu este valid.', 403)
      await statement(db, 'INSERT OR IGNORE INTO moderators (seat,user_id) VALUES (1,?)', id).run()
      return redirect(root + 'moderare/')
    }
  }
  if (seat?.user_id !== id) return problem('Această pagină este rezervată moderatorului.', 403)
  if (request.method === 'GET' && url.pathname === root + 'moderare/') {
    const queue = await all(db, `SELECT p.*, (SELECT r.reason FROM reports r WHERE r.post_id=p.id ORDER BY r.created_at LIMIT 1) AS report_reason
      FROM posts p WHERE status='in_verificare' OR (status='publicat' AND EXISTS (SELECT 1 FROM reports WHERE post_id=p.id))
      ORDER BY CASE WHEN p.status='publicat' THEN 0 ELSE 1 END, p.created_at LIMIT 80`)
    return review(queue, false)
  }
  const action = /^\/comunitate\/moderare\/([0-9a-f-]{36})\/$/.exec(url.pathname)
  if (request.method !== 'POST' || !action || !uuid.test(action[1])) return problem('Acțiunea nu este disponibilă.', 405)
  const values = await formValues(request, url)
  const reason = field(values, 'reason', 'Motivul deciziei', 5, 400)
  const { decision } = values
  const postId = action[1]
  if (decision === 'rezolvat') {
    await db.batch([
      statement(db, `INSERT INTO decisions (post_id,previous_status,status,actor_id,reason)
        SELECT id,status,status,?,? FROM posts WHERE id=? AND status='publicat' AND EXISTS (SELECT 1 FROM reports WHERE post_id=?)`, id, reason, postId, postId),
      statement(db, 'DELETE FROM reports WHERE post_id=?', postId),
    ])
  } else {
    const previous = { publicat: 'in_verificare', respins: 'in_verificare', retras: 'publicat' }
    if (!Object.hasOwn(previous, decision)) return problem('Alege o decizie validă.', 422)
    const result = await statement(db, `UPDATE posts SET status=?, decision_by=?, decision_reason=?, decision_at=CURRENT_TIMESTAMP,
      published_at=CASE WHEN ?='publicat' THEN CURRENT_TIMESTAMP ELSE published_at END WHERE id=? AND status=?`,
    decision, id, reason, decision, postId, previous[decision]).run()
    if (!result.meta.changes) return problem('Fișa s-a schimbat. Deschide din nou coada de moderare.', 409)
  }
  return redirect(root + 'moderare/')
}

async function community(request, env, url) {
  const db = env.DB
  if (!db) return problem('Comunitatea se pregătește. Catalogul rămâne disponibil.', 503)
  const id = userId(request)
  const { pathname, searchParams } = url
  if (request.method === 'GET' && (pathname === root || pathname === root + 'index.json')) {
    const { posts, filters, hasMore } = await listPosts(db, searchParams, id)
    if (pathname.endsWith('index.json')) {
      return Response.json({ results: posts.map(({ id, title, category, audience }) => ({ id, title, category: categories[category], audience: audiences[audience] })), hasMore }, {
        headers: { 'Access-Control-Allow-Origin': 'https://gout648.github.io', 'Cache-Control': 'public, max-age=30', 'X-Content-Type-Options': 'nosniff' },
      })
    }
    return feed(posts, filters, id, hasMore)
  }
  const publicRoute = postPath.exec(pathname)
  if (publicRoute && uuid.test(publicRoute[1])) return publicPost(db, publicRoute[1], publicRoute[2] || publicRoute[3], request, url, id)
  if (pathname.startsWith(root + 'moderare/')) return moderatorRoute(db, request, url, id, env)
  if (![root + 'cont/', root + 'scrie/', root + 'recomandari/'].includes(pathname)) return problem('Pagina nu există.', 404)
  if (!id) {
    if (request.method !== 'GET') return problem('Intră în cont pentru a continua.', 401)
    const returnPage = pathname.slice(root.length) + (pathname.endsWith('/scrie/') ? url.search : '')
    return signIn(returnPage)
  }
  if (!['GET', 'POST'].includes(request.method)) return problem('Acțiunea nu este disponibilă.', 405)
  if (pathname === root + 'scrie/') return composePost(db, request, searchParams, id)
  if (pathname === root + 'recomandari/') return recommendationRoute(db, request, url, id)
  if (request.method === 'POST') {
    const values = await formValues(request, url)
    if (!Object.hasOwn(roles, values.role)) return problem('Alege unul dintre cele patru roluri.', 422)
    await statement(db, 'INSERT INTO profiles (user_id,role) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role', id, values.role).run()
    return redirect(safeComposeReturn(values.next) || root + 'cont/')
  }
  const profile = await statement(db, 'SELECT role FROM profiles WHERE user_id=?', id).first()
  const posts = await all(db, 'SELECT id,title,status,decision_reason FROM posts WHERE author_id=? ORDER BY created_at DESC LIMIT 60', id)
  const seat = await statement(db, 'SELECT user_id FROM moderators WHERE seat=1').first()
  return account(profile, posts, seat?.user_id === id, searchParams.get('trimis') === '1', safeComposeReturn(searchParams.get('next')))
}

function safeComposeReturn(value) {
  if (typeof value !== 'string' || value.length > 350 || !/^\/comunitate\/(scrie|recomandari)\/(\?[^#\r\n]*)?$/.test(value)) return ''
  return value
}

async function recommendationRoute(db, request, url, id) {
  const path = root + 'recomandari/'
  const profile = await statement(db, 'SELECT interests,preferred_category,preferred_audience,teaching_context FROM profiles WHERE user_id=?', id).first()
  if (!profile) return redirect(root + 'cont/?next=' + encodeURIComponent(path))
  if (request.method === 'POST') {
    const values = await formValues(request, url)
    const interests = field(values, 'interests', 'Teme', 0, 120) || ''
    const context = field(values, 'context', 'Treaptă sau disciplină', 0, 70) || ''
    await statement(db, 'UPDATE profiles SET interests=?,preferred_category=?,preferred_audience=?,teaching_context=? WHERE user_id=?',
      interests, valueOf(values.category, categories, ''), valueOf(values.audience, audiences, ''), context, id).run()
    return redirect(path)
  }
  const preferences = { interests: profile.interests, category: profile.preferred_category,
    audience: profile.preferred_audience, context: profile.teaching_context }
  if (!Object.values(preferences).some(Boolean)) return recommendations(preferences, [])
  const posts = await all(db, `SELECT id,title,category,audience,source_url,deadline,event_date,search_text
    FROM posts WHERE status='publicat' ORDER BY published_at DESC LIMIT 300`)
  const candidates = [...opportunities, ...posts.map(post => ({
    title: post.title, category: post.category, audiences: [post.audience], source: post.source_url,
    href: root + 'p/' + post.id + '/', deadline: post.deadline, eventDate: post.event_date, searchText: post.search_text,
  }))]
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Chisinau', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]))
  return recommendations(preferences, rankOpportunities(candidates, preferences, [parts.year, parts.month, parts.day].join('-')))
}

function staticFile(request, url) {
  if (!['GET', 'HEAD'].includes(request.method)) return problem('Acțiunea nu este disponibilă.', 405)
  let key = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname
  if (!Object.hasOwn(assets, key) && Object.hasOwn(assets, key + '/index.html')) return redirect(key + '/' + url.search)
  if (!Object.hasOwn(assets, key)) return problem('Pagina nu există.', 404)
  const type = typeFor[key.split('.').at(-1)]
  return new Response(request.method === 'HEAD' ? null : assets[key], {
    headers: { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'public, max-age=120', 'X-Content-Type-Options': 'nosniff' },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/comunitate') return redirect(root + url.search)
    if (!url.pathname.startsWith(root)) return staticFile(request, url)
    try {
      return await community(request, env, url)
    } catch (error) {
      if (error instanceof InputError) return problem(error.message, 422)
      console.error('Puntea community request failed', error.name)
      return problem('Comunitatea este temporar indisponibilă. Poți reveni la catalog.', 503)
    }
  },
}
