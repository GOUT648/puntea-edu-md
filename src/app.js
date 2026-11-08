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
  const results = document.querySelector('[data-results]')
  const empty = document.querySelector('[data-empty]')
  const fold = value => value.normalize('NFD').replace(/\p{Mark}/gu, '').toLocaleLowerCase('ro-MD')
  const records = [...document.querySelectorAll('[data-record]')].map(element => ({
    element, index: fold(element.dataset.search),
  }))

  function find() {
    const terms = fold(input.value.trim()).split(/\s+/)
    let matches = 0
    for (const { element, index } of records) {
      element.hidden = !terms.every(term => index.includes(term))
      if (!element.hidden) matches += 1
    }
    results.textContent = matches === 1 ? '1 fișă' : matches + ' fișe'
    empty.hidden = matches > 0
  }

  input.value = (query.get('q') || '').slice(0, input.maxLength)
  find()
  searchForm.addEventListener('submit', event => {
    event.preventDefault()
    const address = new URL(location.href)
    if (input.value.trim()) address.searchParams.set('q', input.value.trim())
    else address.searchParams.delete('q')
    address.hash = 'catalog'
    history.replaceState(null, '', address)
    find()
    document.getElementById('catalog-title').focus()
  })
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
    const back = document.querySelector('[data-practice-return]')
    document.querySelector('[data-practice-title]').textContent = title
    kit.href = origin + 'fisa.txt'
    back.href = example ? origin + '#exemplu' : origin
    back.textContent = example ? '← Activitate' : '← Fișa ediției'
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
