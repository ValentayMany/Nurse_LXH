export default async function staffRoutes(app) {

  // GET /api/staff — รายชื่อบุคลากรทั้งหมด
  app.get('/', async (request, reply) => {
    const { data, error } = await request.supabaseService
      .from('staff')
      .select('id, name, position, department, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    if (error) return reply.code(500).send({ error: error.message })
    return { success: true, data }
  })

  // POST /api/staff — เพิ่มบุคลากร (admin เท่านั้น)
  app.post('/', async (request, reply) => {
    if (!request.currentUser.isAdmin) {
      return reply.code(403).send({ error: 'เฉพาะ Admin เท่านั้น' })
    }

    const { name, position = 'Nurse', department = 'Nursing' } = request.body || {}
    if (!name?.trim()) return reply.code(400).send({ error: 'กรุณาใส่ชื่อ' })

    const { data, error } = await request.supabaseService
      .from('staff')
      .insert({ name: name.trim(), position, department })
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })

    await request.supabaseService.from('audit_log').insert({
      user_email: request.currentUser.email,
      action:     'insert',
      table_name: 'staff',
      record_id:  String(data.id),
      new_value:  { name, position }
    })

    return { success: true, data }
  })

  // DELETE /api/staff/:id — ลบบุคลากร (soft delete)
  app.delete('/:id', async (request, reply) => {
    if (!request.currentUser.isAdmin) {
      return reply.code(403).send({ error: 'เฉพาะ Admin เท่านั้น' })
    }

    const { id } = request.params
    const { error } = await request.supabaseService
      .from('staff')
      .update({ is_active: false })
      .eq('id', parseInt(id))

    if (error) return reply.code(500).send({ error: error.message })

    await request.supabaseService.from('audit_log').insert({
      user_email: request.currentUser.email,
      action:     'delete',
      table_name: 'staff',
      record_id:  id
    })

    return { success: true }
  })
}
