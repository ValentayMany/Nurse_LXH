import { authApi } from './api.js'

let currentUser = null

export function getUser() {
  return currentUser
}

export function isAdmin() {
  return currentUser?.role === 'admin'
}

/** @param {object} [opts] */
export async function requireAuth(opts = {}) {
  const { redirect = '/login', adminOnly = false } = opts
  try {
    currentUser = await authApi.me()
    if (adminOnly && currentUser.role !== 'admin') {
      window.location.href = '/'
      return null
    }
    return currentUser
  } catch {
    const next = encodeURIComponent(window.location.pathname)
    window.location.href = `${redirect}?next=${next}`
    return null
  }
}

export function renderNav(active = '') {
  const el = document.getElementById('app-nav')
  if (!el) return

  const links = [
    { href: '/', label: 'ຕາຕາລາງເດືອນ', id: 'nav-month' },
    { href: '/daily', label: 'ເວນປະຈຳວັນ', id: 'nav-daily' },
    { href: '/summary', label: 'ສະຫຼຸບເດືອນ', id: 'nav-summary' },
    { href: '/staff', label: 'ບຸກຄະລາກອນ', id: 'nav-staff' }
  ]

  if (isAdmin()) {
    links.push({ href: '/users', label: 'ຜູ້ໃຊ້', id: 'nav-users' })
  }

  el.innerHTML = links
    .map(l => `<a href="${l.href}" class="${active === l.href ? 'active' : ''}">${l.label}</a>`)
    .join('')

  const userEl = document.getElementById('user-info')
  if (userEl && currentUser) {
    const role = currentUser.role === 'admin' ? 'Admin' : 'User'
    userEl.textContent = `${currentUser.fullName || currentUser.email} (${role})`
  }
}

export async function logout() {
  await authApi.logout().catch(() => {})
  window.location.href = '/login'
}
