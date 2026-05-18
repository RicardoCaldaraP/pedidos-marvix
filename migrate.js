#!/usr/bin/env node
// Roda as migrations do Supabase
// Uso: node migrate.js <DB_PASSWORD>

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const dbPassword = process.argv[2]

if (!dbPassword) {
  console.error('\n❌ Senha do banco não fornecida.')
  console.error('   Uso: node migrate.js <DB_PASSWORD>')
  console.error('\n   A senha está em: Supabase Dashboard → Settings → Database → Database password\n')
  process.exit(1)
}

const PROJECT_REF = 'jigskwrmivykhvujcjfh'

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  console.log('\n🔗 Conectando ao banco...')
  await client.connect()
  console.log('✅ Conectado!\n')

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('seed'))
    .sort()

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`⏳ Executando: ${file}`)
    try {
      await client.query(sql)
      console.log(`✅ ${file} OK\n`)
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`⚠️  ${file} — já existe, pulando\n`)
      } else {
        console.error(`❌ Erro em ${file}: ${err.message}\n`)
        throw err
      }
    }
  }

  await client.end()
  console.log('🎉 Migrations concluídas! O banco está pronto.\n')
}

run().catch(err => {
  console.error('Falha nas migrations:', err.message)
  process.exit(1)
})
