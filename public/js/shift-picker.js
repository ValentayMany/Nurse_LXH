/** Modal เลือกเวน — ใช้ในตารางรายเดือน
 * @param {object} opts
 * @param {boolean} [opts.allowClear] — ถ้า false ปุ่มลบเวนจะถูกซ่อน (non-admin)
 */
export function openShiftPicker({ shiftTypes, currentCode, day, staffName, onSelect, allowClear = true }) {
  const overlay = document.createElement('div')
  overlay.className = 'shift-picker-overlay'
  overlay.innerHTML = `
    <div class="shift-picker" role="dialog" aria-modal="true">
      <h3>ເລືອກເວນ — ວັນທີ ${day}</h3>
      <p class="shift-picker-sub">${escapeHtml(staffName || '')}</p>
      <div class="shift-picker-grid"></div>
      <div class="shift-picker-actions">
        ${allowClear ? `<button type="button" class="secondary" data-action="clear">ລຶບເວນ</button>` : ''}
        <button type="button" class="secondary" data-action="cancel">ຍົກເລີກ</button>
      </div>
    </div>
  `

  const grid = overlay.querySelector('.shift-picker-grid')
  for (const t of shiftTypes) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'shift-picker-btn' + (t.code === currentCode ? ' active' : '')
    btn.style.background = t.color_hex || '#607d8b'
    btn.innerHTML = `<strong>${t.code}</strong><span>${escapeHtml(t.name_lao || t.name || '')}</span>`
    btn.onclick = () => { cleanup(); onSelect(t.code) }
    grid.appendChild(btn)
  }

  if (allowClear) {
    overlay.querySelector('[data-action="clear"]').onclick = () => { cleanup(); onSelect(null) }
  }
  overlay.querySelector('[data-action="cancel"]').onclick = cleanup
  overlay.onclick = (e) => { if (e.target === overlay) cleanup() }

  function cleanup() {
    overlay.remove()
    document.body.style.overflow = ''
  }

  document.body.style.overflow = 'hidden'
  document.body.appendChild(overlay)
}

function escapeHtml(s) {
  const d = document.createElement('div')
  d.textContent = s ?? ''
  return d.innerHTML
}
