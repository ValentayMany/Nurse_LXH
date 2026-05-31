# ລະບົບຕາຕາລາງເວນພະຍາບານ (Luckxay Hospital)

Fastify + Supabase + HTML frontend — ຕາຕາລາງຮາຍເດືອນແບບ Excel

## ເລີ່ມໃຊ້

```bash
npm install
cp .env.example .env
# ແກ້ .env — ຄັດລອກ key ທັງໝົດຈາກ Supabase → Settings → API
npm run dev
```

ເປີດ **http://localhost:3000**

## ຕັ້ງຄ່າ Supabase

1. ຮັນ `supabase/schema.sql` ໃນ SQL Editor
2. Authentication → Users → ສ້າງ user
3. ເພີ່ມແຖວໃນ `app_users` (auth_id, email, role='admin')

```sql
INSERT INTO app_users (auth_id, email, full_name, role)
VALUES ('<uuid-ຈາກ-auth.users>', 'admin@hospital.la', 'Admin', 'admin');
```

## Import ຈາກ Excel

```bash
pip install openpyxl supabase python-dotenv
python scripts/import-from-xlsx.py "d:\Luckxay_Hospital\ID\ອັບເດດຕາຕາລາງເດືອນ6.xlsx" --year 2026 --month 6
```

## ໜ້າຕ່างๆ

| URL | ຄຳອະທິບາຍ |
|-----|------------|
| `/` | ຕາຕາລາງເວນຮາຍເດືອນ |
| `/daily` | ເວນປະຈຳວັນ |
| `/summary` | ສະຫຼຸບຈຳນວນເວນ |
| `/staff` | ຈັດການພະຍາບານ |
| `/users` | ຈັດການຜູ້ໃຊ້ (admin) |
| `/import` | ຄູ່ມື import Excel |

## ⚠️ .env ສຳຄັນ

`SUPABASE_ANON_KEY` ແລະ `SUPABASE_SERVICE_KEY` ຕ້ອງ**ຍາວເຕັມ** (ປະມານ 200+ ຕົວ ຖ້າເປັນ JWT `eyJ...`)  
ຖ້າສັ້ນແບບ 46 ຕົວ ຈະ login ບໍ່ໄດ້ / `Invalid API key`
