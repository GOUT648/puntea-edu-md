import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

export function localDatabase() {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync(new URL('../drizzle/0000_community.sql', import.meta.url), 'utf8'))
  return {
    prepare(sql) {
      return {
        bind(...params) {
          const query = db.prepare(sql)
          return {
            async first() { return query.get(...params) || null },
            async all() { return { results: query.all(...params) } },
            async run() { return { meta: { changes: query.run(...params).changes } } },
          }
        },
      }
    },
    async batch(statements) {
      db.exec('BEGIN')
      try {
        const results = []
        for (const statement of statements) results.push(await statement.run())
        db.exec('COMMIT')
        return results
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}
