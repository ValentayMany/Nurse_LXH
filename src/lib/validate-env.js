/** ตรวจ .env ก่อนรัน — แจ้งชัดถ้า key สั้นเกินไป */
export function validateEnv() {
  const url = process.env.SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || ''
  const service = process.env.SUPABASE_SERVICE_KEY || ''

  const issues = []

  if (!url?.includes('supabase.co')) {
    issues.push('SUPABASE_URL ບໍ່ຖືກຕ້ອງ (ຕ້ອງເປັນ https://xxx.supabase.co)')
  }
  if (anon.length < 80) {
    issues.push(`SUPABASE_ANON_KEY ສັ້ນເກີນไป (${anon.length} ຕົວ) — ຄັດລອກ anon public key ທັງໝົດຈາກ Supabase → Settings → API`)
  }
  if (service.length < 80) {
    issues.push(`SUPABASE_SERVICE_KEY ສັ້ນເກີນไป (${service.length} ຕົວ) — ຄັດລອກ service_role key ທັງໝົດ`)
  }

  return issues
}
