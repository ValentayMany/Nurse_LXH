export default async function scheduleRoutes(app) {

  // GET /api/schedule/:year/:month — ดึงตารางเวนทั้งเดือน
  app.get('/:year/:month', async (request, reply) => {
    const { year, month } = request.params

    // ดึง staff ทั้งหมด (active)
    const { data: staffList, error: staffErr } = await request.supabaseService
      .from('staff')
      .select('id, name, position, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    if (staffErr) return reply.code(500).send({ error: staffErr.message })

    // ดึงตารางเวนของเดือนนั้น
    const { data: schedules, error: schedErr } = await request.supabaseService
      .from('schedules')
      .select('staff_id, shift_code, work_date')
      .eq('year', parseInt(year))
      .eq('month', parseInt(month))

    if (schedErr) return reply.code(500).send({ error: schedErr.message })

    // จัด shifts เป็น { staffId: { day: shiftCode } }
    const shiftMap = {}
    for (const row of schedules) {
      const day = new Date(row.work_date).getDate()
      if (!shiftMap[row.staff_id]) shiftMap[row.staff_id] = {}
      shiftMap[row.staff_id][day] = row.shift_code
    }

    // รวมข้อมูล
    const data = staffList.map(s => ({
      id:     s.id,
      name:   s.name,
      shifts: shiftMap[s.id] || {}
    }))

    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()

    return {
      success: true,
      data,
      daysInMonth,
      year:  parseInt(year),
      month: parseInt(month),
      role:  request.currentUser.role,
      email: request.currentUser.email
    }
  })

  // POST /api/schedule/shift — ใส่เวน (user: เฉพาะช่องว่าง | admin: ทุกช่อง)
  app.post('/shift', async (request, reply) => {
    const { staffId, year, month, day, shiftCode } = request.body || {}
    if (!staffId || !year || !month || !day) {
      return reply.code(400).send({ error: 'ข้อมูลไม่ครบ' })
    }

    const workDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`

    // Non-admin: ตรวจสอบก่อนว่ามีเวนอยู่แล้วหรือไม่
    if (!request.currentUser.isAdmin) {
      // ห้ามลบเวน
      if (!shiftCode) {
        return reply.code(403).send({ error: 'ເຮັດໄດ້ສະເພາະ Admin — ບໍ່ສາມາດລຶບເວນໄດ້' })
      }
      // ห้ามแก้ไขเวนที่มีอยู่แล้ว
      const { data: existing } = await request.supabaseService
        .from('schedules')
        .select('id')
        .eq('staff_id', staffId)
        .eq('work_date', workDate)
        .maybeSingle()

      if (existing) {
        return reply.code(403).send({ error: 'ເຮັດໄດ້ສະເພາະ Admin — ຊ່ອງນີ້ມີເວນຢູ່ແລ້ວ' })
      }
    }

    let result
    if (!shiftCode) {
      // ลบเวน (admin only — ตรวจสอบแล้วด้านบน)
      result = await request.supabaseService
        .from('schedules')
        .delete()
        .eq('staff_id', staffId)
        .eq('work_date', workDate)
    } else {
      // upsert เวน
      result = await request.supabaseService
        .from('schedules')
        .upsert({
          staff_id:   staffId,
          shift_code: shiftCode,
          work_date:  workDate,
          created_by: request.currentUser.id,
          updated_by: request.currentUser.id
        }, { onConflict: 'staff_id,work_date' })
    }

    if (result.error) return reply.code(500).send({ error: result.error.message })

    // บันทึก audit log
    await request.supabaseService.from('audit_log').insert({
      user_email: request.currentUser.email,
      action:     shiftCode ? 'upsert' : 'delete',
      table_name: 'schedules',
      record_id:  `${staffId}:${workDate}`,
      new_value:  shiftCode ? { shift_code: shiftCode } : null
    })

    return { success: true }
  })

  // GET /api/schedule/daily?year=&month=&day= — เวนรายวัน
  app.get('/daily', async (request, reply) => {
    const { year, month, day } = request.query
    if (!year || !month || !day) return reply.code(400).send({ error: 'ระบุวันที่ให้ครบ' })

    const workDate = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`

    const { data, error } = await request.supabaseService
      .from('v_schedules')
      .select('shift_code, shift_name_lao, staff_name, color_hex')
      .eq('work_date', workDate)
      .order('staff_sort_order')

    if (error) return reply.code(500).send({ error: error.message })

    // จัดกลุ่มตาม shift_code
    const summary = {}
    for (const row of data) {
      if (!summary[row.shift_code]) {
        summary[row.shift_code] = { nameLao: row.shift_name_lao, color: row.color_hex, staff: [] }
      }
      summary[row.shift_code].staff.push(row.staff_name)
    }

    return { success: true, summary, year: parseInt(year), month: parseInt(month), day: parseInt(day) }
  })

  // GET /api/schedule/summary?year=&month= — สรุปเดือน
  app.get('/summary', async (request, reply) => {
    const { year, month } = request.query
    if (!year || !month) return reply.code(400).send({ error: 'ระบุ year และ month' })

    const { data, error } = await request.supabaseService
      .from('v_monthly_summary')
      .select('*')
      .eq('year', parseInt(year))
      .eq('month', parseInt(month))

    if (error) return reply.code(500).send({ error: error.message })

    // pivot: staff → { shiftCode: count }
    const staffMap = {}
    for (const row of data) {
      if (!staffMap[row.staff_id]) {
        staffMap[row.staff_id] = { name: row.staff_name, counts: {} }
      }
      staffMap[row.staff_id].counts[row.shift_code] = parseInt(row.shift_count)
    }

    return { success: true, data: Object.values(staffMap) }
  })

  // POST /api/schedule/bulk — บันทึกหลายเวนพร้อมกัน (admin)
  app.post('/bulk', async (request, reply) => {
    if (!request.currentUser.isAdmin) {
      return reply.code(403).send({ error: 'เฉพาะ Admin เท่านั้น' })
    }

    const { entries } = request.body || {}
    if (!Array.isArray(entries) || !entries.length) {
      return reply.code(400).send({ error: 'ส่ง entries เป็น array' })
    }

    const rows = []
    for (const e of entries) {
      const { staffId, year, month, day, shiftCode } = e
      if (!staffId || !year || !month || !day || !shiftCode) continue
      const workDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      rows.push({
        staff_id: staffId,
        shift_code: shiftCode === 'BS' ? 'B/S' : shiftCode,
        work_date: workDate,
        created_by: request.currentUser.id,
        updated_by: request.currentUser.id
      })
    }

    if (!rows.length) return reply.code(400).send({ error: 'ไม่มีข้อมูลที่บันทึกได้' })

    const { error } = await request.supabaseService
      .from('schedules')
      .upsert(rows, { onConflict: 'staff_id,work_date' })

    if (error) return reply.code(500).send({ error: error.message })
    return { success: true, count: rows.length }
  })

  // GET /api/schedule/shift-types — ดึง shift types ทั้งหมด
  app.get('/shift-types', async (request, reply) => {
    const { data, error } = await request.supabaseService
      .from('shift_types')
      .select('code, name, name_lao, start_time, end_time, color_hex, is_overnight')
      .order('sort_order')

    if (error) return reply.code(500).send({ error: error.message })
    return { success: true, data }
  })
}
