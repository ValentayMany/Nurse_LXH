import fp from 'fastify-plugin'
import { createClient } from '@supabase/supabase-js'

export default fp(async function (app) {
  // anon client — ใช้ RLS ตาม session ของ user
  const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  // service client — bypass RLS (ใช้สำหรับ server-side write เช่น audit_log)
  const supabaseService = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  // แนบ clients เข้า request ทุกตัว
  app.decorateRequest('supabase', null)
  app.decorateRequest('supabaseService', null)

  app.addHook('preHandler', async (request) => {
    // ดึง access_token จาก cookie แล้วเซ็ตให้ anon client
    const token = request.cookies?.access_token
    if (token) {
      await supabaseAnon.auth.setSession({
        access_token: token,
        refresh_token: request.cookies?.refresh_token || ''
      })
    }
    request.supabase = supabaseAnon
    request.supabaseService = supabaseService
  })
})
