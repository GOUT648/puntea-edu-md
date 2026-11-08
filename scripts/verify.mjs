import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { localDatabase } from './local-d1.mjs'
import worker from '../dist/server/index.js'
import { rankOpportunities } from '../src/recommendations.mjs'

const origin = 'https://puntea.example'
const code = randomUUID() + randomUUID()
const env = { DB: localDatabase(), PUNTEA_MODERATOR_HASH: createHash('sha256').update(code).digest('hex') }

function visit(path, user, fields, requestOrigin = origin) {
  const headers = new Headers()
  if (user) headers.set('oai-authenticated-user-id', user)
  if (fields) {
    headers.set('Origin', requestOrigin)
    headers.set('Content-Type', 'application/x-www-form-urlencoded')
  }
  const request = new Request(origin + path, {
    method: fields ? 'POST' : 'GET',
    headers,
    body: fields ? new URLSearchParams(fields) : undefined,
  })
  return worker.fetch(request, env)
}

const homepage = await (await visit('/')).text()
for (const name of ['Cursuri', 'Concursuri', 'Comunități', 'Evenimente', 'Granturi', 'Proiecte']) assert.match(homepage, new RegExp(name))
assert.equal((await visit('/practica/')).status, 200)
assert.equal((await visit('/o/matematica-2027/')).status, 200)
assert.match(await (await visit('/comunitate/cont/')).text(), /signin-with-chatgpt/)
assert.equal((await visit('/comunitate/cont/', null, { role: 'profesor' })).status, 401)
assert.equal((await visit('/comunitate/cont/', 'author', { role: 'moderator' })).status, 422)
assert.equal((await visit('/comunitate/cont/', 'author', { role: 'profesor' }, 'https://foreign.example')).status, 422)

for (const role of ['elev', 'profesor', 'scoala', 'companie']) {
  const response = await visit('/comunitate/cont/', 'user-' + role, { role })
  assert.equal(response.status, 303)
  assert.match(await (await visit('/comunitate/cont/', 'user-' + role)).text(), new RegExp('value="' + role + '" selected'))
}
const author = 'user-profesor'
const moderator = 'operator-fixture'
assert.equal((await visit('/comunitate/moderare/activare/', moderator, { code: 'x'.repeat(50) })).status, 403)
assert.equal((await visit('/comunitate/moderare/activare/', moderator, { code })).status, 303)
assert.equal((await visit('/comunitate/moderare/activare/', 'second-user', { code })).status, 403)
assert.equal((await visit('/comunitate/moderare/', author)).status, 403)
assert.equal((await visit('/comunitate/recomandari/', author, { interests: 'matematică', category: 'formari', audience: 'profesori', context: 'gimnaziu' })).status, 303)
assert.match(await (await visit('/comunitate/recomandari/', author)).text(), /value="matematică"/)
assert.doesNotMatch(await (await visit('/comunitate/recomandari/', 'user-companie')).text(), /value="matematică"/)
const candidate = { title: 'Curs de matematică', category: 'formari', audiences: ['profesori'], source: 'https://example.org', searchText: 'matematică gimnaziu', deadline: '2026-11-12' }
const ranked = rankOpportunities([candidate, { ...candidate, title: 'Închis', deadline: '2026-11-07' },
  { ...candidate, title: 'General', audiences: ['toti'], conflict: true }], {
  interests: 'matematica', category: 'formari', audience: 'profesori', context: 'gimnaziu',
}, '2026-11-08')
assert.deepEqual(ranked.map(({ title, score }) => [title, score]), [['Curs de matematică', 100], ['General', 85]])

const id = randomUUID()
const path = '/comunitate/p/' + id + '/'
const proposal = { id, kind: 'anunt', category: 'formari', audience: 'profesori', title: 'Formare practică la matematică',
  organizer: 'Organizator de probă', source_url: 'https://example.org/formare',
  summary: 'Un exemplu de formare continuă pentru testul tehnic.', deadline: '2027-01-20', event_date: '2027-01-22', context_id: 'ecuatii' }
assert.equal((await visit('/comunitate/scrie/', author, { ...proposal, source_url: 'javascript:alert(1)' })).status, 422)
assert.equal((await visit('/comunitate/scrie/', author, { ...proposal, deadline: '2027-02-29' })).status, 422)
assert.equal((await visit('/comunitate/scrie/', author, proposal)).status, 303)
assert.equal((await visit('/comunitate/scrie/', author, proposal)).status, 303)
assert.equal((await visit(path)).status, 404)
assert.deepEqual((await (await visit('/comunitate/index.json')).json()).results, [])
assert.equal((await visit('/comunitate/moderare/' + id + '/', author, { decision: 'publicat', reason: 'Sursă confirmată' })).status, 403)
assert.equal((await visit('/comunitate/moderare/' + id + '/', moderator, { decision: 'publicat', reason: 'Sursă confirmată' })).status, 303)
assert.equal((await visit('/comunitate/moderare/' + id + '/', moderator, { decision: 'publicat', reason: 'Sursă confirmată' })).status, 409)
const publicPage = await (await visit(path)).text()
assert.match(publicPage, /Ecuații de gradul I/)
assert.doesNotMatch(publicPage, /user-profesor|operator-fixture/)
assert.match(await (await visit(path + 'calendar.ics')).text(), /DTSTART;VALUE=DATE:20270120/)
const search = await (await visit('/comunitate/index.json?q=matematica+formare&categorie=formari&public=profesori')).json()
assert.equal(search.results.length, 1)
assert.equal(search.results[0].id, id)
assert.deepEqual((await (await visit('/comunitate/index.json?categorie=concursuri')).json()).results, [])

const evidenceId = randomUUID()
const evidence = { id: evidenceId, kind: 'cercetare', audience: 'toti', title: 'Rezultatele activității',
  summary: 'Observații sintetizate dintr-un exercițiu fictiv.', source_url: 'https://example.org/studiu',
  method: 'Comparație între două fișe de exercițiu.', limits: 'Exemplu demonstrativ.', context_id: 'p-' + id }
assert.equal((await visit('/comunitate/scrie/', 'user-elev', evidence)).status, 303)
assert.equal((await visit('/comunitate/moderare/' + evidenceId + '/', moderator, { decision: 'respins', reason: 'Clarifică metoda.' })).status, 303)
assert.equal((await visit('/comunitate/scrie/', 'user-elev', { ...evidence, revizuire: 'da' })).status, 303)
assert.equal((await visit('/comunitate/moderare/' + evidenceId + '/', moderator, { decision: 'publicat', reason: 'Metodă documentată.' })).status, 303)
assert.match(await (await visit(path)).text(), /Rezultatele activității/)
assert.equal((await visit(path + 'semnaleaza/', 'user-scoala', { reason: 'Verifică sursa organizatorului.' })).status, 303)
assert.match(await (await visit('/comunitate/moderare/', moderator)).text(), /Verifică sursa organizatorului/)
assert.equal((await visit('/comunitate/moderare/' + id + '/', moderator, { decision: 'rezolvat', reason: 'Sursa este în regulă.' })).status, 303)
assert.equal((await visit(path + 'retrage/', 'user-companie', {})).status, 404)
assert.equal((await visit(path + 'retrage/', author, {})).status, 303)
assert.equal((await visit(path)).status, 404)
console.log('Verificat: 4 roluri, izolare, moderare, retrimitere, filtre, calendar, legături, semnalare și retragere.')
