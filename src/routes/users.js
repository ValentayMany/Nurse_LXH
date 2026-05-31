export default async function usersRoutes(app) {

  // ทุก route ใน file นี้ต้องเป็น admin
  app.addHook('preHandler', async (request, reply) => {
    if (!request.currentUser?.isAdmin) {
      return reply.code(403).send({ error: 'เฉพาะ Admin เท่านั้น' })
    }
  })

  // GET /api/users — รายชื่อผู้ใช้ทั้งหมด
  app.get('/', async (request, reply) => {
    const { data, error } = await request.supabaseService
      .from('app_users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at')

    if (error) return reply.code(500).send({ error: error.message })
    return { success: true, data }
  })

  // PATCH /api/users/:id/role — เปลี่ยน role
  app.patch('/:id/role', async (request, reply) => {
    const { id } = request.params
    const { role } = request.body || {}

    if (!['admin', 'user'].includes(role)) {
      return reply.code(400).send({ error: 'role ต้องเป็น admin หรือ user' })
    }

    const { error } = await request.supabaseService
      .from('app_users')
      .update({ role })
      .eq('id', id)

    if (error) return reply.code(500).send({ error: error.message })

    await request.supabaseService.from('audit_log').insert({
      user_email: request.currentUser.email,
      action:     'update_role',
      table_name: 'app_users',
      record_id:  id,
      new_value:  { role }
    })

    return { success: true }
  })

  // DELETE /api/users/:id — ระงับ user (soft delete)
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const { error } = await request.supabaseService
      .from('app_users')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return reply.code(500).send({ error: error.message })

    await request.supabaseService.from('audit_log').insert({
      user_email: request.currentUser.email,
      action:     'disable_user',
      table_name: 'app_users',
      record_id:  id
    })

    return { success: true }
  })
}
