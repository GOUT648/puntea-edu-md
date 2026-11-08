import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import { catalog } from './catalog.mjs'
import { audienceKeys, kindToCategory } from './src/taxonomy.mjs'

const project = fileURLToPath(new URL('./', import.meta.url))
const origin = process.argv[2] || 'https://puntea-edu-md-v1.reedycivet4.chatgpt.site'
execFileSync(process.execPath, ['build.mjs', origin], { cwd: project, stdio: 'inherit' })

const dist = join(project, 'dist')
const output = join(dist, 'server')
const assets = Object.create(null)
for (const item of readdirSync(dist, { recursive: true, withFileTypes: true })) {
  if (!item.isFile() || !/\.(html|css|js|svg|txt|xml|webmanifest|png)$/.test(item.name)) continue
  const file = join(item.parentPath, item.name)
  const path = relative(dist, file).replaceAll('\\', '/')
  if (path.startsWith('server/') || path.startsWith('.openai/')) continue
  assets['/' + path] = readFileSync(file, path.endsWith('.png') ? 'base64' : 'utf8')
}
const editions = Object.fromEntries(catalog.map(({ id, title }) => [
  id, { title, href: '/o/' + id + '/', practice: '/practica/?fisa=' + id + '#fisa' },
]))
editions.ecuatii = { title: 'Ecuații de gradul I', href: '/solutie/#exemplu', practice: '/practica/?exemplu=ecuatii#fisa' }
mkdirSync(output, { recursive: true })
for (const [from, to] of [['worker.mjs', 'index.js'], ['community.mjs', 'community.mjs'], ['taxonomy.mjs', 'taxonomy.mjs'], ['recommendations.mjs', 'recommendations.mjs']]) {
  copyFileSync(join(project, 'src', from), join(output, to))
}
const opportunities = catalog.map(item => ({
  title: item.title, category: item.category || kindToCategory[item.kind],
  audiences: item.audience.map(name => audienceKeys[name]), source: item.source,
  href: '/o/' + item.id + '/', deadline: item.deadline, eventDate: item.event?.at(-1),
  conflict: item.status === 'conflict',
  searchText: [item.title, item.summary, item.keywords, item.eligible, item.provider].join(' '),
}))
writeFileSync(join(output, 'assets.mjs'), 'export const assets = ' + JSON.stringify(assets) +
  '\nexport const editions = ' + JSON.stringify(editions) +
  '\nexport const opportunities = ' + JSON.stringify(opportunities) + '\n')
console.log('Worker: ' + Object.keys(assets).length + ' resurse încorporate.')
