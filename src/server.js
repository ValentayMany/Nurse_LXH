import app from './app.js'
import 'dotenv/config'
import { validateEnv } from './lib/validate-env.js'

const port = parseInt(process.env.PORT || '3000')

const envIssues = validateEnv()
if (envIssues.length) {
  console.error('\n⚠️  ກວດ .env ບໍ່ຜ່ານ:\n')
  envIssues.forEach(m => console.error('   •', m))
  console.error('\n   ແກ້ໃນ .env ແລ້ວ restart server (ເບິ່ງ .env.example)\n')
}

try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`Server running at http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
