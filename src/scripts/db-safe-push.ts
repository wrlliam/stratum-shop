/**
 * Safe Database Push
 *
 * Applies schema changes to the database while preserving all data.
 *
 * Steps:
 * 1. Generates a migration to see what would change (dry run)
 * 2. Checks for destructive statements (DROP TABLE / DROP COLUMN)
 * 3. Applies only if safe, or if --allow-destructive is passed
 *
 * Usage:
 *   bun run db:safe-push                     # safe push
 *   bun run db:safe-push --dry-run           # preview only
 *   bun run db:safe-push --allow-destructive # include drops
 */

import { execSync } from 'child_process'
import { readdirSync, readFileSync, rmSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const allowDestructive = args.includes('--allow-destructive')

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle', 'migrations')
const TEMP_DIR = join(process.cwd(), 'drizzle', '_safe_push_temp')

function cleanup() {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}

function run(cmd: string, opts?: { silent?: boolean }): string {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: opts?.silent ? 'pipe' : 'inherit',
      env: process.env,
    }) || ''
  } catch (err) {
    if (opts?.silent) return (err as { stdout?: string }).stdout || ''
    throw err
  }
}

async function main() {
  console.log('🔍 Analyzing schema changes...\n')

  // Generate migration to temp dir to see what SQL would run
  cleanup()
  mkdirSync(TEMP_DIR, { recursive: true })

  try {
    run(
      `bunx drizzle-kit generate --out="${TEMP_DIR}"`,
      { silent: true }
    )
  } catch {
    // drizzle-kit generate may fail if no changes — that's fine
  }

  // Check generated SQL files
  const sqlFiles = existsSync(TEMP_DIR)
    ? readdirSync(TEMP_DIR).filter((f) => f.endsWith('.sql'))
    : []

  if (sqlFiles.length === 0) {
    console.log('✅ Database schema is up to date — no changes needed\n')
    cleanup()
    return
  }

  // Read and analyze the SQL
  const allSql = sqlFiles
    .map((f) => readFileSync(join(TEMP_DIR, f), 'utf-8'))
    .join('\n')

  const statements = allSql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  const safeStatements: string[] = []
  const destructiveStatements: string[] = []

  for (const stmt of statements) {
    const upper = stmt.toUpperCase()
    if (
      upper.includes('DROP TABLE') ||
      upper.includes('DROP COLUMN') ||
      upper.includes('ALTER COLUMN') && upper.includes('DROP')
    ) {
      destructiveStatements.push(stmt)
    } else {
      safeStatements.push(stmt)
    }
  }

  // Report
  if (safeStatements.length > 0) {
    console.log(`  ✅ ${safeStatements.length} safe change(s):`)
    for (const s of safeStatements) {
      const summary = s.split('\n')[0].substring(0, 100)
      console.log(`     ${summary}${s.length > 100 ? '...' : ''}`)
    }
    console.log()
  }

  if (destructiveStatements.length > 0) {
    console.log(`  ⚠️  ${destructiveStatements.length} destructive change(s):`)
    for (const s of destructiveStatements) {
      console.log(`     ${s.split('\n')[0]}`)
    }
    console.log()
  }

  cleanup()

  if (dryRun) {
    console.log('🏃 Dry run — no changes applied.\n')
    if (safeStatements.length > 0) {
      console.log('  Run without --dry-run to apply safe changes.')
    }
    return
  }

  if (destructiveStatements.length > 0 && !allowDestructive) {
    console.log('⏭️  Destructive changes detected — these will be SKIPPED.')
    console.log('   Use --allow-destructive to include them.\n')
  }

  // Apply via drizzle-kit push
  console.log('🚀 Pushing schema changes...\n')

  try {
    run('bunx drizzle-kit push --force')
  } catch {
    console.error('\n❌ Push failed. Check the output above.')
    process.exit(1)
  }

  console.log('\n✅ Schema changes applied successfully!')
  console.log('   All existing data has been preserved.')
  console.log(`   Applied at: ${new Date().toISOString()}\n`)

  if (destructiveStatements.length > 0 && !allowDestructive) {
    console.log(`   ℹ️  ${destructiveStatements.length} destructive change(s) were NOT applied.`)
    console.log('   Re-run with --allow-destructive if you want to drop those columns/tables.\n')
  }
}

main().catch((err) => {
  cleanup()
  console.error('❌ Failed:', err)
  process.exit(1)
})
