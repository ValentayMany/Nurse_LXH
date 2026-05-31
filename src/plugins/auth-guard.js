// middleware: เช็คว่า login อยู่หรือเปล่า ถ้าไม่ → 401
export default async function authGuard(request, reply) {
  const token = request.cookies?.access_token
  if (!token) {
    return reply.code(401).send({ error: 'กรุณา login ก่อน' })
  }

  const { data: { user }, error } = await request.supabase.auth.getUser(token)
  if (error || !user) {
    return reply.code(401).send({ error: 'Session หมดอายุ กรุณา login ใหม่' })
  }

  // ดึงข้อมูล role จาก app_users
  const { data: appUser } = await request.supabaseService
    .from('app_users')
    .select('id, role, full_name, is_active')
    .eq('auth_id', user.id)
    .single()

  if (!appUser || !appUser.is_active) {
    return reply.code(403).send({ error: 'บัญชีนี้ถูกระงับการใช้งาน' })
  }

  // แนบข้อมูล user เข้า request ใช้ได้ใน route handlers
  request.currentUser = {
    id:       appUser.id,
    authId:   user.id,
    email:    user.email,
    fullName: appUser.full_name,
    role:     appUser.role,
    isAdmin:  appUser.role === 'admin'
  }
}
