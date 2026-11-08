import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { catalog, urls, verified } from './catalog.mjs'
import { evidence } from './research.mjs'
import { audienceKeys, audiences, categories, kindToCategory, mainCategories } from './src/taxonomy.mjs'

const site = process.argv[2] ? new URL(process.argv[2]).href.replace(/\/$/, '') : ''
const dist = new URL('./dist/', import.meta.url)
const referenceSite = 'https://puntea-edu-md-v1.reedycivet4.chatgpt.site/'
const repository = 'https://github.com/GOUT648/puntea-edu-md'
const mirror = site.includes('github.io/')
const community = mirror ? referenceSite + 'comunitate/' : '/comunitate/'
const guide = repository + '/blob/main/docs/PLATFORMA.md'
const calendarDate = new Intl.DateTimeFormat('ro-MD', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const formatDate = value => calendarDate.format(new Date(value + 'T12:00:00Z'))
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const pathFor = item => 'o/' + item.id + '/'
const paths = ['', 'practica/', 'solutie/', 'documentatie/', ...catalog.map(pathFor)]
const example = {
  id: 'ecuatii',
  title: 'Ecuații de gradul I',
  curriculum: 'Matematică · clasa a VII-a · 2019 · UC 4.6',
  busola: 'https://curriculum.lappsus.com/c/2019/matematica/vii.html',
  source: 'https://mec.gov.md/sites/default/files/matematica_gimnaziu_ro.pdf#page=34',
  activity: 'Trei caiete la același preț și un pix de 12 lei costă 42 de lei. Cât costă un caiet?',
}
const statuses = { deadline: 'Termen publicat', check: 'De confirmat', calendar: 'Calendar oficial', resource: 'Resursă', conflict: 'Date contradictorii', closed: 'Termen trecut' }
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
const search = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/></svg>'
const link = (href, label, style = '') => `<a class="${style}" href="${esc(href)}">${esc(label)}</a>`
const external = (href, label, style = '') => `<a class="${style}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`

function layout(title, description, path, body) {
  const base = '../'.repeat(path.split('/').filter(Boolean).length) || './'
  const url = site && site + '/' + path
  const script = base + 'assets/app.js?v=4'
  return `<!doctype html>
<html lang="ro-MD">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · Puntea Edu MD</title>
  <meta name="description" content="${esc(description)}"><meta name="theme-color" content="#f5f5ec">
  ${url ? `<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}">` : ''}
  <meta property="og:title" content="${esc(title)} · Puntea Edu MD"><meta property="og:description" content="${esc(description)}">
  <link rel="icon" href="${base}assets/mark.svg" type="image/svg+xml">
  ${mirror ? '' : `<link rel="manifest" href="${base}manifest.webmanifest"><link rel="apple-touch-icon" href="${base}assets/app-192.png">`}
  <link rel="stylesheet" href="${base}assets/style.css?v=4"><script src="${script}" defer></script>
</head>
<body>
  <a class="skip" href="#continut">Sari la conținut</a>
  <header class="site-header wrap">
    <a class="brand" href="${base}"><img src="${base}assets/mark.svg" width="36" height="36" alt=""><span>Puntea Edu <small>MD</small></span></a>
    <nav aria-label="Navigare principală">${link(base + '#catalog', 'Caută')}${link(community, 'Comunitate')}${link(community + 'cont/', 'Cont')}</nav>
  </header>
  <main id="continut">${body}</main>
  <footer class="site-footer wrap"><span>Puntea Edu MD <span aria-hidden="true">·</span> Pilot DigiEduHack</span><span>${link((mirror ? referenceSite : base) + 'documentatie/#instalare', 'Instalează aplicația')} · ${link(base + 'documentatie/#surse', 'Surse')}</span></footer>
</body>
</html>`
}

function card(item) {
  const status = item.deadline && item.deadline < verified ? 'closed' : item.status
  const category = item.category || kindToCategory[item.kind]
  const index = [item.title, item.provider, item.kind, categories[category], item.eligible, item.summary, item.keywords, ...item.audience].join(' ')
  return `<li data-record data-category="${category}" data-audience="${item.audience.map(name => audienceKeys[name]).join(' ')}" data-search="${esc(index)}"><a class="offer" href="./${pathFor(item)}">
    <span class="offer-type">${esc(item.kind)} · ${esc(item.provider)}</span>
    <strong>${esc(item.title)}</strong>
    <span class="offer-date"><span class="status" data-status="${status}"${item.deadline ? ` data-deadline="${item.deadline}"` : ''}>${statuses[status]}</span>
      ${item.deadline ? esc(formatDate(item.deadline)) : ''}</span>${arrow}
  </a></li>`
}

const filterButton = (key, label) => `<button type="button" class="chip" data-filter-category="${key}" aria-pressed="${!key}">${esc(label)}</button>`
const home = `<div class="wrap home">
  <section class="search-home" id="catalog" aria-labelledby="search-title">
    <p class="eyebrow">FORMARE CONTINUĂ · REPUBLICA MOLDOVA</p>
    <h1 id="search-title">Ce vrei să găsești?</h1>
    <p class="intro">Cursuri, concursuri și proiecte pentru profesori și școli.</p>
    <form class="catalog-controls" data-search-form data-community="${community}" action="./#catalog" method="get" role="search">
      <div class="search-form"><label for="cautare" class="sr-only">Caută în catalog</label>${search}
        <input id="cautare" type="search" name="q" placeholder="Caută un concurs, o formare sau o competență…" autocomplete="off" maxlength="80">
        <button class="button" type="submit">Caută</button>
      </div>
      <div class="filter-row">
        <div class="chips" role="group" aria-label="Categorie">
          ${filterButton('', 'Toate')}${mainCategories.map(key => filterButton(key, categories[key])).join('')}
          <details class="extra-filters"><summary>Mai multe</summary><div class="chips">${Object.entries(categories).filter(([key]) => !mainCategories.includes(key)).map(([key, label]) => filterButton(key, label)).join('')}</div></details>
        </div>
        <label class="audience-filter"><span>Public</span><select name="public"><option value="">Toți</option>${Object.entries(audiences).filter(([key]) => key !== 'toti').map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join('')}</select></label>
      </div>
    </form>
    <div class="handoff quick-links"><a href="./o/busola-curriculara/">Busola Curriculară</a><a href="./o/mentorat-inel/">Mentorat INEL</a><a href="${community}recomandari/">Recomandări pentru mine</a><a href="./documentatie/#module">Parcursul comun ${arrow}</a></div>
  </section>
  <section class="catalog" aria-labelledby="catalog-title">
    <div class="section-head"><h2 id="catalog-title" tabindex="-1">Catalog</h2><p role="status" data-results>${catalog.length + 1} fișe</p></div>
    <ul class="offers">
      <li data-record data-category="activitati" data-audience="profesori elevi" data-search="matematica ecuatii clasa a VII-a activitate practica profesori elevi curriculum gimnaziu UC 4.6"><a class="offer featured" href="./solutie/#exemplu">
        <span class="offer-type">Activitate · Clasa a VII-a</span><strong>${esc(example.title)}</strong><span class="offer-date">Exemplu pilot</span>${arrow}
      </a></li>
      ${catalog.map(card).join('')}
    </ul>
    <p data-empty hidden>Nu am găsit rezultate în catalog cu aceste filtre.</p>
    <section data-community-results hidden aria-labelledby="community-results-title"><h3 id="community-results-title">Din Comunitate</h3><ul class="offers" data-community-list></ul><a data-community-more href="${community}">Mai multe rezultate</a></section>
  </section>
  <section class="brief"><h2>De la căutare la clasă</h2><p>Găsești o oportunitate, o încerci cu sprijin și împărtășești ce a funcționat.</p>
  <div class="handoff">${link('./documentatie/#module', 'Vezi parcursul →')}${link(community, 'Intră în comunitate →')}</div></section>
</div>`

function detail(item) {
  const dates = []
  if (item.deadline && item.deadline >= verified) dates.push({ start: item.deadline, end: item.deadline, title: (item.deadlineLabel || 'Înscriere') + ' · ' + item.title })
  if (item.event) dates.push({ start: item.event[0], end: item.event.at(-1), title: item.title })
  const deadline = item.deadline ? formatDate(item.deadline) : item.status === 'conflict' ? 'Confirmă la organizator' : 'Consultă apelul organizatorului'
  const offersSupport = item.audience.includes('Profesori')
  const sourceLabel = item.kind === 'Telegram' ? 'Deschide în Telegram' : item.status === 'resource' ? 'Deschide resursa' : 'Deschide la organizator'
  return `<article class="wrap subpage">
    ${link('../../#catalog', '← Catalog', 'back')}
    <p class="eyebrow">${esc(item.kind)} · ${esc(item.provider)}</p>
    <h1>${esc(item.title)}</h1>
    <p class="intro">${esc(item.summary)}</p>
    <section class="sheet" aria-label="Fișa oportunității">
      <dl class="facts">
        <div><dt>Pentru cine</dt><dd>${esc(item.eligible)}</dd></div>
        ${item.status !== 'resource' ? `<div><dt>${esc(item.deadlineLabel || 'Înscriere')}</dt><dd>${item.deadline ? `${esc(deadline)} <span class="status" data-status="deadline" data-deadline="${item.deadline}"></span>` : external(item.source, deadline)}</dd></div>` : ''}
        ${item.when ? `<div><dt>Desfășurare</dt><dd>${esc(item.when)}</dd></div>` : ''}
        ${item.cost ? `<div><dt>Cost</dt><dd>${esc(item.cost)}</dd></div>` : ''}
      </dl>
      <div class="next">
        <p>${esc(item.next)}</p>
        ${external(item.source, sourceLabel, 'button')}
        ${dates.length ? `<button class="text-button" type="button" data-calendar="${esc(JSON.stringify(dates))}" data-id="${item.id}" data-source="${esc(item.source)}" hidden>Salvează în calendar</button>` : ''}
      </div>
    </section>
    <div class="handoff">
      ${offersSupport ? `<a href="../../practica/?fisa=${item.id}#fisa">Sprijin și practică ${arrow}</a>` : ''}
      ${link(community + '?fisa=' + item.id, item.status === 'resource' ? 'Materiale și discuții' : 'Comunitatea acestei ediții')}
      ${item.reference ? external(item.reference[1], item.reference[0]) : ''}
      <span>Verificat la ${esc(formatDate(item.verified || verified))}</span>
    </div>
  </article>`
}

const practiceIndex = Object.fromEntries(catalog.map(item => [item.id, item.title]))
const practice = `<div class="wrap subpage">
  ${link('../#catalog', '← Catalog', 'back')}
  <h1>Încearcă. Notează. Repetă.</h1>
  <div class="sheet practice-sheet" id="fisa">
    <div>
      <h2 data-practice-title>Fișa de practică</h2>
      <p>Activitate · observație · pasul următor</p>
      <ol class="practice-steps"><li><b>7</b> Încearcă</li><li><b>14</b> Discută</li><li><b>30</b> Adaptează</li></ol>
    </div>
    <a class="button" href="./fisa.txt" download="fisa-de-practica.txt" data-kit>Descarcă fișa ↓</a>
  </div>
  <div class="handoff">
    ${external(urls.inel, 'Mentorat INEL')}
    ${external(urls.etwinning, 'Parteneri eTwinning')}
    <a data-research-link href="${community}scrie/?tip=cercetare">Propune o observație</a>
  </div>
  <script type="application/json" id="practice-index">${JSON.stringify(practiceIndex).replaceAll('<', '\\u003c')}</script>
</div>`

const solution = `<article class="wrap subpage" id="exemplu">
  ${link('../#catalog', '← Catalog', 'back')}
  <p class="eyebrow">EXEMPLU PILOT</p>
  <h1>${esc(example.title)}</h1>
  <p class="intro">${esc(example.curriculum)}</p>
  <div class="sheet example-sheet">
    <div>
      <h2>Încearcă în perechi</h2>
      <p>${esc(example.activity)}</p>
      <details><summary>Rezolvare</summary><p>3x + 12 = 42. Un caiet costă 10 lei.</p></details>
    </div>
    <a class="button" href="../practica/?exemplu=ecuatii#fisa">Deschide fișa ${arrow}</a>
  </div>
  <div class="handoff">
    ${external(example.busola, 'Busola Curriculară')}
    ${external(example.source, 'MEC, p. 34')}
    <a href="../o/mentorat-inel/">Mentorat INEL ${arrow}</a>
    ${link(community + '?fisa=ecuatii', 'Comunitatea activității')}
  </div>
</article>`

const docs = `<div class="wrap subpage">
  ${link('../#catalog', '← Catalog', 'back')}
  <section id="module">
    <h1>De la căutare la clasă</h1>
    <p class="intro">O singură fișă leagă oportunitatea, calendarul, sprijinul și ce înveți din practică.</p>
    <ol class="journey" aria-label="Parcursul Puntea Edu">
      <li><strong>Găsești și planifici</strong><p>Alegi o oportunitate și verifici sursa, publicul și termenul.</p><a href="../?categorie=formari#catalog">Găsește o formare ${arrow}</a></li>
      <li><strong>Încerci cu sprijin</strong><p>Pornești de la o fișă, ceri ajutor unui mentor și lucrezi cu colegii.</p><a href="../solutie/#exemplu">Vezi o activitate ${arrow}</a></li>
      <li><strong>Împărtășești ce a funcționat</strong><p>Trimiți o observație legată de fișă. După verificare, colegii o pot găsi în catalog.</p><a href="${community}">Intră în comunitate ${arrow}</a></li>
    </ol>
    <a class="subtle" href="${guide}">Documentația proiectului ↗</a>
  </section>
  <section id="instalare" class="brief"><h2>Puntea Edu pe telefon sau calculator</h2>
    <p>Instalezi din browser și folosești același cont, catalog și comunitate.</p>
    ${mirror ? link(referenceSite + 'documentatie/#instalare', 'Deschide aplicația', 'button') : '<button type="button" class="button" data-install hidden>Instalează Puntea Edu</button>'}
    <p>Pe Android și calculator, caută <b>Instalează aplicația</b> în meniul browserului. Pe iPhone, în Safari, alege <b>Partajare → Adăugați la ecranul principal</b>.</p>
    <p>După prima vizită, catalogul rămâne disponibil offline. Contul și comunitatea folosesc conexiunea la internet.</p>
  </section>
  <section id="surse" class="brief"><h2>Surse</h2>
    <ul class="sources">
      ${evidence.map(([title, credit, , url]) => `<li>${external(url, title)} <small>${esc(credit)}</small></li>`).join('')}
    </ul>
    <details id="metoda"><summary>Repere de lucru</summary><ul class="sources">
      <li>${external(example.busola, 'Busola Curriculară')}</li>
      <li>${external('https://doi.org/10.1111/j.1467-9620.2006.00684.x', 'TPACK')}</li>
      <li>${external('https://www.slideshare.net/slideshow/lori-learning-object-review-instrument/243950974', 'LORI')}</li>
      <li>${external('https://www.kirkpatrickpartners.com/the-kirkpatrick-model/', 'Kirkpatrick')}</li>
    </ul></details>
  </section>
</div>`

function save(path, content) {
  const output = new URL(path, dist)
  mkdirSync(new URL('.', output), { recursive: true })
  writeFileSync(output, content.replace(/^[ \t]+$/gm, ''))
}

function worksheet(title, reference = []) {
  return [title, ...reference, '', 'Ziua 7 · Ce am încercat?', '', 'Ziua 14 · Ce am observat și ce sugerează un coleg?', '',
    'Ziua 30 · Ce schimb data viitoare?', '', 'Folosește observații agregate, fără date despre elevi.', ''].join('\n')
}

save('index.html', layout('De la idee la clasă', 'Oportunități, mentori și activități pentru școlile din Republica Moldova. Catalog pilot DigiEduHack.', '', home))
save('practica/index.html', layout('Fișa de practică', 'Mentorat, parteneri și fișa de practică pentru 30 de zile.', 'practica/', practice))
save('practica/fisa.txt', worksheet('Puntea Edu MD · Fișă de practică'))
save('solutie/index.html', layout(example.title, 'Activitate pilot de matematică pentru clasa a VII-a, cu reper curricular și fișă de practică.', 'solutie/', solution))
save('solutie/fisa.txt', worksheet(example.title, ['Ediție: ' + example.id, example.curriculum, 'Sursă: ' + example.source, '', example.activity, '3x + 12 = 42. Verificare: 3 × 10 + 12 = 42.']))
save('documentatie/index.html', layout('De la căutare la clasă', 'Caută, planifică, lucrează cu alți profesori și împărtășește ce a funcționat la clasă.', 'documentatie/', docs))
for (const item of catalog) {
  save(pathFor(item) + 'index.html', layout(item.title, item.summary, pathFor(item), detail(item)))
  save(pathFor(item) + 'fisa.txt', worksheet(item.title, ['Ediție: ' + item.id, item.provider, 'Sursă: ' + item.source, 'Verificat: ' + (item.verified || verified)]))
}
mkdirSync(new URL('assets/', dist), { recursive: true })
for (const name of ['style.css', 'app.js', 'mark.svg', 'bridge.svg']) {
  copyFileSync(new URL('./src/' + name, import.meta.url), new URL('assets/' + name, dist))
}
if (!mirror) {
  const icons = [192, 512].map(size => {
    const name = 'app-' + size + '.png'
    copyFileSync(new URL('./src/' + name, import.meta.url), new URL('assets/' + name, dist))
    return { src: 'assets/' + name, sizes: size + 'x' + size, type: 'image/png' }
  })
  save('manifest.webmanifest', JSON.stringify({
    id: './', name: 'Puntea Edu MD', short_name: 'Puntea Edu', lang: 'ro-MD', start_url: './',
    scope: './', display: 'standalone', theme_color: '#f5f5ec', background_color: '#f5f5ec', icons,
  }))
  const publicPages = [...paths, 'assets/app.js?v=4', 'assets/style.css?v=4', 'assets/mark.svg']
  const sw = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8')
  const fingerprint = createHash('sha256').update(sw)
  for (const path of publicPages) {
    const filename = path.split('?')[0]
    fingerprint.update(readFileSync(new URL(filename === '' || filename.endsWith('/') ? filename + 'index.html' : filename, dist)))
  }
  save('sw.js', 'const publicPages = ' + JSON.stringify(publicPages) +
    '\nconst version = ' + JSON.stringify(fingerprint.digest('hex').slice(0, 12)) + '\n' + sw)
}
if (site) {
  save('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + paths.map(path => '<url><loc>' + esc(site + '/' + path) + '</loc></url>').join('') + '</urlset>')
  save('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + site + '/sitemap.xml\n')
}
console.log('Built ' + paths.length + ' pages.')
