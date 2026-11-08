'use strict'

const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Chisinau', year: 'numeric', month: '2-digit', day: '2-digit',
})
const parts = Object.fromEntries(date.formatToParts(new Date()).map(({ type, value }) => [type, value]))
const today = [parts.year, parts.month, parts.day].join('-')
const query = new URLSearchParams(location.search)

document.querySelectorAll('[data-deadline]').forEach(badge => {
  if (badge.dataset.deadline < today) {
    badge.textContent = 'Termen trecut'
    badge.dataset.status = 'closed'
  }
})

const searchForm = document.querySelector('[data-search-form]')
if (searchForm) {
  const input = searchForm.elements.q
  const audience = searchForm.elements.public
  const filters = [...searchForm.querySelectorAll('[data-filter-category]')]
  const results = document.querySelector('[data-results]')
  const empty = document.querySelector('[data-empty]')
  const communitySection = document.querySelector('[data-community-results]')
  const communityList = document.querySelector('[data-community-list]')
  const communityMore = document.querySelector('[data-community-more]')
  const community = new URL(searchForm.dataset.community, location.origin)
  const fold = value => value.normalize('NFD').replace(/\p{Mark}/gu, '').toLocaleLowerCase('ro-MD')
  const records = [...document.querySelectorAll('[data-record]')].map(element => ({
    element, index: fold(element.dataset.search),
  }))
  let category = query.get('categorie') || ''
  if (!filters.some(button => button.dataset.filterCategory === category)) category = ''
  audience.value = query.get('public') || ''
  if (audience.selectedIndex < 0) audience.value = ''
  input.value = (query.get('q') || '').slice(0, input.maxLength)
  let timer
  let pending

  function showCount(count, hasMore = false) {
    results.textContent = count === 1 ? '1 rezultat' : count + (hasMore ? '+ rezultate' : ' rezultate')
    empty.hidden = count > 0
  }

  function find() {
    const terms = fold(input.value.trim()).split(/\s+/).filter(Boolean)
    let matches = 0
    for (const { element, index } of records) {
      element.hidden = Boolean(category && element.dataset.category !== category)
        || Boolean(audience.value && !element.dataset.audience.split(' ').includes(audience.value))
        || !terms.every(term => index.includes(term))
      if (!element.hidden) matches += 1
    }
    for (const button of filters) {
      const active = button.dataset.filterCategory === category
      button.setAttribute('aria-pressed', String(active))
      if (active && button.closest('details')) button.closest('details').open = true
    }
    return matches
  }

  async function loadCommunity(params, localCount, signal) {
    const endpoint = new URL('index.json', community)
    endpoint.search = params
    try {
      const response = await fetch(endpoint, { signal, credentials: 'omit' })
      if (!response.ok) return
      const { results: posts, hasMore } = await response.json()
      if (signal.aborted) return
      const items = posts.map(post => {
        const item = document.createElement('li')
        const link = document.createElement('a')
        link.className = 'offer'
        link.href = new URL('p/' + encodeURIComponent(post.id) + '/', community)
        const meta = document.createElement('span')
        meta.className = 'offer-type'
        meta.textContent = post.category + ' · ' + post.audience
        const title = document.createElement('strong')
        title.textContent = post.title
        link.append(meta, title)
        item.append(link)
        return item
      })
      communityList.replaceChildren(...items)
      communitySection.hidden = items.length === 0
      communityMore.href = community.href + '?' + params.toString()
      communityMore.hidden = !hasMore
      showCount(localCount + items.length, hasMore)
    } catch {
      if (!signal.aborted) communitySection.hidden = true
    }
  }

  function update(delay = 0, scroll = false) {
    clearTimeout(timer)
    pending?.abort()
    const controller = new AbortController()
    pending = controller
    communitySection.hidden = true
    const count = find()
    showCount(count)
    const params = new URLSearchParams()
    if (input.value.trim()) params.set('q', input.value.trim())
    if (category) params.set('categorie', category)
    if (audience.value) params.set('public', audience.value)
    const address = new URL(location.href)
    address.search = params
    if (scroll) address.hash = 'catalog'
    timer = setTimeout(() => {
      if (address.href !== location.href) history.replaceState(null, '', address)
      loadCommunity(params, count, controller.signal)
    }, delay)
  }

  for (const button of filters) button.addEventListener('click', () => {
    category = button.dataset.filterCategory
    update()
  })
  input.addEventListener('input', () => update(200))
  audience.addEventListener('change', () => update())
  searchForm.addEventListener('submit', event => {
    event.preventDefault()
    update(0, true)
    document.getElementById('catalog-title').focus()
  })
  update()
}

function downloadCalendar(dates, id, source) {
  const escapeText = value => value.replace(/\\/g, '\\\\').replace(/[\r\n]+/g, '\\n').replace(/([,;])/g, '\\$1')
  const compact = value => value.replaceAll('-', '')
  const nextDay = value => new Date(Date.parse(value + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10)
  const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')
  const events = dates.flatMap(({ start, end, title }, i) => [
    'BEGIN:VEVENT', 'UID:' + id + '-' + start + '-' + i + '@puntea-edu-md',
    'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + compact(start), 'DTEND;VALUE=DATE:' + compact(nextDay(end)),
    'SUMMARY:' + escapeText(title), 'DESCRIPTION:' + escapeText('Sursă: ' + source), 'END:VEVENT',
  ])
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Puntea Edu MD//RO', ...events, 'END:VCALENDAR', '']
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = id + '.ics'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const calendar = document.querySelector('[data-calendar]')
if (calendar) {
  const { calendar: serialized, id, source } = calendar.dataset
  const dates = JSON.parse(serialized).filter(({ end }) => end >= today)
  calendar.hidden = dates.length === 0
  if (dates.length) calendar.addEventListener('click', () => downloadCalendar(dates, id, source))
}

const kit = document.querySelector('[data-kit]')
if (kit) {
  const index = JSON.parse(document.getElementById('practice-index').textContent)
  const id = query.get('fisa')
  const example = query.get('exemplu') === 'ecuatii'
  const title = example ? 'Ecuații de gradul I' : Object.hasOwn(index, id) ? index[id] : ''
  if (title) {
    const origin = example ? '../solutie/' : '../o/' + id + '/'
    const back = document.querySelector('.back')
    document.querySelector('[data-practice-title]').textContent = title
    kit.href = origin + 'fisa.txt'
    back.href = example ? origin + '#exemplu' : origin
    back.textContent = example ? '← Activitate' : '← Fișa ediției'
    const research = document.querySelector('[data-research-link]')
    if (research) {
      const address = new URL(research.href)
      address.searchParams.set('fisa', example ? 'ecuatii' : id)
      research.href = address
    }
  }
}

const archive = document.getElementById('idei-m1')
if (archive) {
  function reveal() {
    const target = document.getElementById(location.hash.slice(1))
    if (!archive.open && target && archive.contains(target)) {
      archive.open = true
      target.scrollIntoView()
    }
  }
  reveal()
  window.addEventListener('hashchange', reveal)
}
const appManifest = document.querySelector('link[rel="manifest"]')
if (appManifest && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('sw.js', appManifest.href)).catch(() => {})
  const install = document.querySelector('[data-install]')
  if (install) {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault()
      install.hidden = false
      install.onclick = async () => {
        install.hidden = true
        await event.prompt()
      }
    })
    window.addEventListener('appinstalled', () => { install.hidden = true })
  }
}
