export default async function authRoutes(app) {
  // POST /api/auth/login
  app.post("/login", async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: "กรุณาใส่ email และ password" });
    }

    const { data, error } = await request.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      return reply.code(401).send({ error: "Email หรือ Password ไม่ถูกต้อง" });

    const { access_token, refresh_token } = data.session;

    // เซ็ต cookie (httpOnly = JS อ่านไม่ได้ ปลอดภัยกว่า)
    const cookieOpts = {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "none",
    };
    reply
      .setCookie("access_token", access_token, {
        ...cookieOpts,
        maxAge: 60 * 60 * 8,
      })
      .setCookie("refresh_token", refresh_token, {
        ...cookieOpts,
        maxAge: 60 * 60 * 24 * 7,
      });

    // ดึง role จาก app_users
    const { data: appUser } = await request.supabaseService
      .from("app_users")
      .select("role, full_name, is_active")
      .eq("auth_id", data.user.id)
      .single();

    if (!appUser?.is_active) {
      return reply.code(403).send({ error: "บัญชีนี้ถูกระงับการใช้งาน" });
    }

    return {
      success: true,
      user: {
        email: data.user.email,
        fullName: appUser.full_name,
        role: appUser.role,
      },
    };
  });

  // POST /api/auth/logout
  app.post("/logout", async (request, reply) => {
    await request.supabase.auth.signOut();
    reply
      .clearCookie("access_token", { path: "/" })
      .clearCookie("refresh_token", { path: "/" });
    return { success: true };
  });

  // GET /api/auth/me — ดูข้อมูล user ปัจจุบัน
  app.get("/me", async (request, reply) => {
    const token = request.cookies?.access_token;
    if (!token) return reply.code(401).send({ error: "ยังไม่ได้ login" });

    const {
      data: { user },
      error,
    } = await request.supabase.auth.getUser(token);
    if (error || !user)
      return reply.code(401).send({ error: "Session หมดอายุ" });

    const { data: appUser } = await request.supabaseService
      .from("app_users")
      .select("role, full_name, is_active")
      .eq("auth_id", user.id)
      .single();

    if (!appUser?.is_active)
      return reply.code(403).send({ error: "บัญชีถูกระงับ" });

    return {
      email: user.email,
      fullName: appUser.full_name,
      role: appUser.role,
    };
  });
}
