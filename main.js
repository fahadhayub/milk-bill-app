import './style.css'

const state = {
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  daysData: {}
}

let activeModalDay = null

const months = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"]
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const colors = ["green", "blue", "orange", "purple"]

function init() {
  populateSelectors()
  loadSettings()
  buildWeekdayLabels()
  buildCalendar()
  bindEvents()
}

function bindEvents() {
  document.getElementById('settingsHeader').addEventListener('click', toggleSettings)
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings)
  document.getElementById('generateBtn').addEventListener('click', generateBill)
  document.getElementById('copyBtn').addEventListener('click', copyBill)
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal)
  document.getElementById('saveCustomBtn').addEventListener('click', saveCustomOrder)
  document.getElementById('customModal').addEventListener('click', (e) => {
    if (e.target.id === 'customModal') closeModal()
  })
}

function toggleSettings() {
  const content = document.getElementById('settingsContent')
  const toggle = document.getElementById('settingsToggle')
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden')
    toggle.innerText = '▲'
  } else {
    content.classList.add('hidden')
    toggle.innerText = '▼'
  }
}

function saveSettings() {
  const settings = {
    custName: document.getElementById('custName').value,
    custAddress: document.getElementById('custAddress').value,
    monthlyCharge: parseInt(document.getElementById('monthlyCharge').value) || 0,
    prices: {
      green: parseInt(document.getElementById('priceGreen').value) || 0,
      blue: parseInt(document.getElementById('priceBlue').value) || 0,
      orange: parseInt(document.getElementById('priceOrange').value) || 0,
      purple: parseInt(document.getElementById('pricePurple').value) || 0,
    },
    defaults: {
      green: parseInt(document.getElementById('defGreen').value) || 0,
      blue: parseInt(document.getElementById('defBlue').value) || 0,
      orange: parseInt(document.getElementById('defOrange').value) || 0,
      purple: parseInt(document.getElementById('defPurple').value) || 0,
    }
  }
  localStorage.setItem('milkBillSettings', JSON.stringify(settings))
  toggleSettings()
  alert("Settings saved!")
}

function getSettings() {
  const saved = localStorage.getItem('milkBillSettings')
  if (saved) return JSON.parse(saved)
  return {
    custName: "Farook", custAddress: "1st Street", monthlyCharge: 20,
    prices: { green: 25, blue: 22, orange: 30, purple: 35 },
    defaults: { green: 3, blue: 0, orange: 0, purple: 0 }
  }
}

function loadSettings() {
  const s = getSettings()
  document.getElementById('custName').value = s.custName
  document.getElementById('custAddress').value = s.custAddress
  document.getElementById('monthlyCharge').value = s.monthlyCharge
  colors.forEach(color => {
    const cap = color.charAt(0).toUpperCase() + color.slice(1)
    document.getElementById(`price${cap}`).value = s.prices[color]
    document.getElementById(`def${cap}`).value = s.defaults[color]
  })
}

function populateSelectors() {
  const mSel = document.getElementById('monthSelect')
  const ySel = document.getElementById('yearSelect')
  months.forEach((m, i) => {
    const opt = document.createElement('option')
    opt.value = i
    opt.text = m
    if (i === state.month) opt.selected = true
    mSel.appendChild(opt)
  })
  for (let i = state.year - 2; i <= state.year + 2; i++) {
    const opt = document.createElement('option')
    opt.value = i
    opt.text = i
    if (i === state.year) opt.selected = true
    ySel.appendChild(opt)
  }
  mSel.addEventListener('change', (e) => {
    state.month = parseInt(e.target.value)
    state.daysData = {}
    buildCalendar()
  })
  ySel.addEventListener('change', (e) => {
    state.year = parseInt(e.target.value)
    state.daysData = {}
    buildCalendar()
  })
}

function buildWeekdayLabels() {
  const container = document.getElementById('weekdayLabels')
  container.innerHTML = ''
  weekdays.forEach(wd => {
    const cell = document.createElement('div')
    cell.className = 'weekday-cell'
    cell.innerText = wd
    container.appendChild(cell)
  })
}

function getStateClass(type) {
  if (type === 'none') return 'state-none'
  if (type === 'custom') return 'state-custom'
  return 'state-default'
}

function getStateLabel(type) {
  if (type === 'none') return 'No Milk'
  if (type === 'custom') return 'Custom'
  return 'Default'
}

function buildCalendar() {
  const cal = document.getElementById('calendar')
  cal.innerHTML = ''
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate()
  const firstWeekday = new Date(state.year, state.month, 1).getDay()

  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement('div')
    empty.className = 'day-btn empty'
    cal.appendChild(empty)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    if (!state.daysData[d]) state.daysData[d] = { type: 'default' }
    const btn = document.createElement('button')
    btn.className = `day-btn ${getStateClass(state.daysData[d].type)}`
    btn.innerHTML = `${d}<br><span>${getStateLabel(state.daysData[d].type)}</span>`
    btn.addEventListener('click', () => handleDayClick(d))
    cal.appendChild(btn)
  }
}

function handleDayClick(d) {
  const dayData = state.daysData[d]
  if (dayData.type === 'default') {
    dayData.type = 'none'
    buildCalendar()
  } else if (dayData.type === 'none') {
    dayData.type = 'custom'
    openCustomModal(d)
  } else {
    dayData.type = 'default'
    delete dayData.custom
    buildCalendar()
  }
}

function openCustomModal(d) {
  activeModalDay = d
  document.getElementById('modalDay').innerText = d
  const dayData = state.daysData[d]
  const s = getSettings()
  const vals = dayData.custom || s.defaults
  colors.forEach(color => {
    const cap = color.charAt(0).toUpperCase() + color.slice(1)
    document.getElementById(`mod${cap}`).value = vals[color] || 0
  })
  document.getElementById('customModal').classList.add('active')
}

function closeModal() {
  document.getElementById('customModal').classList.remove('active')
  activeModalDay = null
}

function saveCustomOrder() {
  if (activeModalDay === null) return
  const custom = {}
  colors.forEach(color => {
    const cap = color.charAt(0).toUpperCase() + color.slice(1)
    custom[color] = parseInt(document.getElementById(`mod${cap}`).value) || 0
  })
  state.daysData[activeModalDay].custom = custom
  state.daysData[activeModalDay].type = 'custom'
  closeModal()
  buildCalendar()
}

function getDayQuantities(d) {
  const dayData = state.daysData[d]
  if (!dayData || dayData.type === 'none') {
    return { green: 0, blue: 0, orange: 0, purple: 0 }
  }
  if (dayData.type === 'custom' && dayData.custom) {
    return dayData.custom
  }
  return getSettings().defaults
}

function generateBill() {
  const s = getSettings()
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate()
  const totals = { green: 0, blue: 0, orange: 0, purple: 0 }
  let grandTotal = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const qty = getDayQuantities(d)
    colors.forEach(c => { totals[c] += qty[c] || 0 })
  }

  let bill = ""
  bill += "═══════════════════════════════\n"
  bill += "       MILK BILL RECEIPT       \n"
  bill += "═══════════════════════════════\n\n"
  bill += `Customer : ${s.custName}\n`
  bill += `Address  : ${s.custAddress}\n`
  bill += `Month     : ${months[state.month]} ${state.year}\n`
  bill += "───────────────────────────────\n\n"
  bill += "PACKET   QTY   PRICE   AMOUNT\n"
  bill += "───────────────────────────────\n"

  colors.forEach(c => {
    const cap = c.charAt(0).toUpperCase() + c.slice(1)
    const qty = totals[c]
    const price = s.prices[c]
    const amount = qty * price
    grandTotal += amount
    bill += `${cap.padEnd(8)} ${String(qty).padStart(3)}   ₹${String(price).padStart(4)}   ₹${String(amount).padStart(6)}\n`
  })

  bill += "───────────────────────────────\n"
  bill += `Milk Total          ₹${String(grandTotal).padStart(8)}\n`
  bill += `Monthly Charge     ₹${String(s.monthlyCharge).padStart(8)}\n`
  const finalTotal = grandTotal + s.monthlyCharge
  bill += "═══════════════════════════════\n"
  bill += `GRAND TOTAL        ₹${String(finalTotal).padStart(8)}\n`
  bill += "═══════════════════════════════\n\n"
  bill += `Generated on ${new Date().toLocaleDateString()}\n`

  document.getElementById('billOutput').textContent = bill
  document.getElementById('resultCard').style.display = 'block'
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth' })
}

function copyBill() {
  const text = document.getElementById('billOutput').textContent
  navigator.clipboard.writeText(text).then(() => {
    alert("Bill copied to clipboard!")
  }).catch(() => {
    alert("Could not copy. Please select and copy manually.")
  })
}

init()
