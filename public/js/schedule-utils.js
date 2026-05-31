const WEEKDAY_LA = ['ອາ', 'ຈ', 'ອ', 'ພ', 'ພຫ', 'ສ', 'ສ']
const WEEKDAY_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** @param {number} year @param {number} month @param {number} day */
export function getWeekdayIndex(year, month, day) {
  return new Date(year, month - 1, day).getDay()
}

/** @param {number} year @param {number} month */
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/** @param {Map<string, object>} shiftTypeMap @param {string} code */
export function shiftColor(shiftTypeMap, code) {
  if (!code) return '#e0e0e0'
  const key = code.replace('/', '_')
  const t = shiftTypeMap.get(code) || shiftTypeMap.get(key)
  return t?.color_hex || defaultColor(code)
}

function defaultColor(code) {
  const map = {
    M: '#43a047',
    E: '#fb8c00',
    EN: '#8e24aa',
    N: '#1a237e',
    'B/S': '#9e9e9e',
    BS: '#9e9e9e',
    AL: '#fdd835',
    MN: '#5c6bc0',
    ME: '#26a69a',
    'AL/N': '#ff7043'
  }
  return map[code] || '#607d8b'
}

/**
 * Count shifts per day for summary rows (ອັດຕາກຳລັງ)
 * @param {Array<{shifts: Record<number,string>}>} staffData
 * @param {number} days
 * @param {string[]} codes
 */
export function countByDay(staffData, days, codes) {
  const result = {}
  for (const code of codes) {
    result[code] = {}
    for (let d = 1; d <= days; d++) result[code][d] = 0
  }
  for (const row of staffData) {
    for (let d = 1; d <= days; d++) {
      const c = row.shifts?.[d]
      if (!c) continue
      const norm = c.toUpperCase()
      const key = norm === 'BS' ? 'B/S' : norm
      if (result[key] !== undefined) result[key][d]++
      else if (result[c] !== undefined) result[c][d]++
    }
  }
  return result
}

export { WEEKDAY_LA, WEEKDAY_EN }
