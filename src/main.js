import "./style.css";
import { sbSelect, sbInsert, sbUpdate, sbDelete } from "./supabase.js";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const ETRANSFER_EMAIL = "gerardmak2003@gmail.com";
const SLOT_DURATION = 45;
const SLOTS_PER_DAY = 8;

// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  appointments: [],
  scheduleOverrides: {},
  defaultStartTime: "16:00",
  selectedDate: new Date(),
  selectedSlot: null,
  paymentMethod: "cash",
  activeTab: "today",
  isAdmin: false,
};

// ─── RENDER APP SHELL ────────────────────────────────────────────────────────
document.getElementById("app").innerHTML = `
  <div class="loading-bar" id="loadingBar"></div>

  <div class="header">
    <div class="logo">GerardCuts<span>Barbershop</span></div>
    <div class="header-nav">
      <span class="db-status" id="dbStatus">
        <span class="db-dot" id="dbDot"></span>
        <span id="dbLabel">Connecting…</span>
      </span>
      <button class="nav-btn active" id="navCustomer" onclick="showView('customer', this)">Book Appointment</button>
      <button class="nav-btn" id="navAdmin" onclick="showView('admin-login', this)">Admin</button>
    </div>
  </div>

  <!-- CUSTOMER VIEW -->
  <div class="view active" id="view-customer">
    <h2>Book Your Cut</h2>
    <p class="subtitle">Choose a date and an available time slot below.</p>
    <div class="date-nav">
      <button onclick="changeDay(-1)">&#8592;</button>
      <div class="date-label" id="dateLabel"></div>
      <button onclick="changeDay(1)">&#8594;</button>
      <span class="start-time-badge">Starts at <b id="startTimeBadge">4:00 PM</b></span>
    </div>
    <div class="slots-grid" id="slotsGrid"></div>
    <div id="bookingFormWrap" style="display:none;">
      <div class="booking-panel">
        <h3>Your Details</h3>
        <div class="form-row">
          <div class="form-group"><label>First Name</label><input type="text" id="c-fname" placeholder="John"></div>
          <div class="form-group"><label>Last Name</label><input type="text" id="c-lname" placeholder="Doe"></div>
        </div>
        <div class="form-row single">
          <div class="form-group"><label>Comments (optional)</label><textarea id="c-comments" placeholder="Any special requests..."></textarea></div>
        </div>
        <div class="payment-section">
          <span class="payment-label">Payment Method</span>
          <div class="payment-toggle">
            <button class="pay-opt active" id="pay-cash" onclick="selectPayment('cash')">💵 Cash</button>
            <button class="pay-opt" id="pay-etransfer" onclick="selectPayment('etransfer')">📲 e-Transfer</button>
          </div>
          <div id="fb-cash" class="payment-feedback cash-fb">
            <span class="fb-icon">✅</span>
            <div class="fb-text"><b>Pay with Cash</b>Payment is due at time of service.</div>
          </div>
          <div id="fb-etransfer" class="payment-feedback etransfer-fb" style="display:none;">
            <div class="fb-inner-row">
              <span class="fb-icon">📲</span>
              <div class="fb-text"><b>Pay via e-Transfer</b>Send your payment before your appointment to the address below.</div>
            </div>
            <div class="etransfer-row">
              <div class="et-left">
                <span class="et-hint">Send to</span>
                <span class="et-email">${ETRANSFER_EMAIL}</span>
              </div>
              <button class="copy-btn" id="copyBtn" onclick="copyEmail()">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Copy
              </button>
            </div>
          </div>
        </div>
        <button class="submit-btn" id="submitBtn" onclick="submitCustomerBooking()">Request Appointment</button>
      </div>
    </div>
  </div>

  <!-- ADMIN LOGIN -->
  <div class="view" id="view-admin-login">
    <div class="login-wrap">
      <div class="login-logo">✂️ Admin Access</div>
      <p>Enter the admin password to manage appointments.</p>
      <input type="password" id="adminPwInput" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()">
      <button class="gold-btn full" onclick="doLogin()">Sign In</button>
      <div class="login-error" id="loginError"></div>
    </div>
  </div>

  <!-- ADMIN VIEW -->
  <div class="view" id="view-admin">
    <h2>Dashboard</h2>
    <p class="subtitle">Manage appointments, schedules, and add new bookings.</p>
    <div class="admin-grid">
      <div>
        <div class="schedule-config">
          <h4>Schedule Settings</h4>
          <p>Set the default start time and override specific dates.</p>
          <div class="default-row">
            <div class="cf"><label>Default Start Time</label><input type="time" id="cfg-default-time" value="16:00"></div>
            <button class="gold-btn" onclick="saveDefaultTime()">Save Default</button>
          </div>
          <hr class="section-divider">
          <div class="override-label">Date Overrides</div>
          <div class="config-row">
            <div class="cf"><label>Date</label><input type="date" id="cfg-date"></div>
            <div class="cf"><label>Start Time</label><input type="time" id="cfg-time"></div>
            <button class="gold-btn" onclick="addOverride()">Add Override</button>
          </div>
          <div class="override-list" id="overrideList"></div>
        </div>
        <div class="card">
          <h3>Add Appointment</h3>
          <div class="admin-form">
            <label>First Name</label><input type="text" id="a-fname" placeholder="First name">
            <label>Last Name</label><input type="text" id="a-lname" placeholder="Last name">
            <label>Date</label><input type="date" id="a-date" onchange="refreshAdminSlots()">
            <label>Time Slot</label><select id="a-time"></select>
            <label>Comments</label><textarea id="a-comments" placeholder="Notes..."></textarea>
            <button class="gold-btn full" id="adminSubmitBtn" onclick="adminAddAppointment()">Add Appointment</button>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <h3>Appointments</h3>
          <div class="tabs">
            <div class="tab active" onclick="setTab('today', this)">Today</div>
            <div class="tab" onclick="setTab('upcoming', this)">Upcoming</div>
            <div class="tab" onclick="setTab('pending', this)">Pending</div>
            <div class="tab" onclick="setTab('archive', this)">Archive</div>
          </div>
          <div id="apptList"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
`;

// ─── LOADING BAR ─────────────────────────────────────────────────────────────
function loadingStart() {
  document.getElementById("loadingBar").className = "loading-bar active";
}
function loadingDone() {
  const b = document.getElementById("loadingBar");
  b.className = "loading-bar done";
  setTimeout(() => (b.className = "loading-bar"), 400);
}

// ─── DB STATUS ────────────────────────────────────────────────────────────────
function setDbStatus(status) {
  const dot = document.getElementById("dbDot");
  const lbl = document.getElementById("dbLabel");
  if (status === "connected") {
    dot.className = "db-dot connected";
    lbl.textContent = "Live";
  } else if (status === "error") {
    dot.className = "db-dot error";
    lbl.textContent = "Offline";
  } else {
    dot.className = "db-dot";
    lbl.textContent = "Connecting…";
  }
}

// ─── BOOT: LOAD FROM SUPABASE ─────────────────────────────────────────────────
async function loadState() {
  loadingStart();
  try {
    const appts = await sbSelect("appointments", "?order=date.asc,time.asc");
    state.appointments = appts.map((a) => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      date: a.date,
      time: a.time,
      service: a.service,
      payment: a.payment,
      comments: a.comments,
      status: a.status,
      createdBy: a.created_by,
    }));

    const settings = await sbSelect("schedule_settings", "?id=eq.1");
    if (settings && settings.length > 0) {
      state.defaultStartTime = settings[0].default_start_time || "16:00";
      state.scheduleOverrides = settings[0].overrides || {};
    }

    setDbStatus("connected");
  } catch (e) {
    console.error("DB load error:", e);
    setDbStatus("error");
    toast("Could not connect to database.", true);
  }
  loadingDone();
  renderSlots();
}

// ─── SAVE SCHEDULE ────────────────────────────────────────────────────────────
async function saveScheduleToDb() {
  try {
    await sbUpdate(
      "schedule_settings",
      {
        default_start_time: state.defaultStartTime,
        overrides: state.scheduleOverrides,
      },
      "?id=eq.1",
    );
  } catch (e) {
    toast("Failed to save schedule settings.", true);
  }
}

// ─── TIME UTILS ───────────────────────────────────────────────────────────────
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getStartMins(dk) {
  const t = state.scheduleOverrides[dk] || state.defaultStartTime;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minsToLabel(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}
function getSlots(dk) {
  const start = getStartMins(dk);
  return Array.from({ length: SLOTS_PER_DAY }, (_, i) =>
    minsToLabel(start + i * SLOT_DURATION),
  );
}
function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function formatTime24(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}
function formatOverrideDate(dk) {
  return new Date(dk + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function todayKey() {
  return dateKey(new Date());
}

function isBeforeToday(d) {
  return dateKey(d) < todayKey();
}

// ─── CUSTOMER: SLOTS ──────────────────────────────────────────────────────────
window.changeDay = function (n) {
  const d = new Date(state.selectedDate);
  d.setDate(d.getDate() + n);
  // Block navigating before today
  if (n < 0 && isBeforeToday(d)) return;
  state.selectedDate = d;
  state.selectedSlot = null;
  document.getElementById("bookingFormWrap").style.display = "none";
  renderSlots();
};

function slotStatus(slot, dk) {
  const a = state.appointments.find((a) => a.date === dk && a.time === slot);
  if (!a) return "available";
  if (a.status === "approved") return "booked";
  if (a.status === "pending") return "pending";
  return "available";
}

function renderSlots() {
  const dk = dateKey(state.selectedDate);
  const slots = getSlots(dk);
  const startLabel = formatTime24(
    state.scheduleOverrides[dk] || state.defaultStartTime,
  );
  document.getElementById("dateLabel").textContent = formatDate(
    state.selectedDate,
  );
  document.getElementById("startTimeBadge").textContent = startLabel;

  // Dim back arrow when already on today
  const backBtn = document.querySelector(".date-nav button:first-child");
  if (backBtn) {
    const onToday = dk === todayKey();
    backBtn.style.opacity = onToday ? "0.35" : "1";
    backBtn.style.cursor = onToday ? "not-allowed" : "pointer";
  }
  document.getElementById("slotsGrid").innerHTML = slots
    .map((slot) => {
      const st = slotStatus(slot, dk);
      const isSel = slot === state.selectedSlot;
      let cls = "slot",
        lbl = "Available";
      if (isSel) {
        cls += " selected";
        lbl = "✓ Selected";
      } else if (st === "booked") {
        cls += " booked";
        lbl = "Booked";
      } else if (st === "pending") {
        cls += " slot-pending";
        lbl = "Pending";
      }
      return `<div class="${cls}" onclick="selectSlot('${slot}')">
      <div class="slot-time">${slot}</div>
      <div class="slot-status">${lbl}</div>
    </div>`;
    })
    .join("");
}

window.selectSlot = function (slot) {
  const dk = dateKey(state.selectedDate);
  if (slotStatus(slot, dk) !== "available") return;
  state.selectedSlot = state.selectedSlot === slot ? null : slot;
  document.getElementById("bookingFormWrap").style.display = state.selectedSlot
    ? "block"
    : "none";
  renderSlots();
};

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
window.selectPayment = function (method) {
  state.paymentMethod = method;
  document
    .getElementById("pay-cash")
    .classList.toggle("active", method === "cash");
  document
    .getElementById("pay-etransfer")
    .classList.toggle("active", method === "etransfer");
  document.getElementById("fb-cash").style.display =
    method === "cash" ? "flex" : "none";
  document.getElementById("fb-etransfer").style.display =
    method === "etransfer" ? "flex" : "none";
};

window.copyEmail = function () {
  navigator.clipboard
    .writeText(ETRANSFER_EMAIL)
    .then(() => {
      const btn = document.getElementById("copyBtn");
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2.5 8.5L6 12L13.5 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Copy`;
        btn.classList.remove("copied");
      }, 2500);
    })
    .catch(() => toast("Select the email manually to copy."));
};

// ─── CUSTOMER: SUBMIT ─────────────────────────────────────────────────────────
window.submitCustomerBooking = async function () {
  const fn = document.getElementById("c-fname").value.trim();
  const ln = document.getElementById("c-lname").value.trim();
  if (!fn || !ln) {
    toast("Please enter your first and last name.");
    return;
  }
  if (!state.selectedSlot) {
    toast("Please select a time slot.");
    return;
  }
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Submitting…";
  loadingStart();
  try {
    const inserted = await sbInsert("appointments", {
      first_name: fn,
      last_name: ln,
      date: dateKey(state.selectedDate),
      time: state.selectedSlot,
      service: "Haircut",
      payment: state.paymentMethod,
      comments: document.getElementById("c-comments").value.trim(),
      status: "pending",
      created_by: "customer",
    });
    state.appointments.push({
      id: inserted[0].id,
      firstName: fn,
      lastName: ln,
      date: dateKey(state.selectedDate),
      time: state.selectedSlot,
      service: "Haircut",
      payment: state.paymentMethod,
      comments: document.getElementById("c-comments").value.trim(),
      status: "pending",
      createdBy: "customer",
    });
    document.getElementById("c-fname").value = "";
    document.getElementById("c-lname").value = "";
    document.getElementById("c-comments").value = "";
    state.selectedSlot = null;
    selectPayment("cash");
    document.getElementById("bookingFormWrap").style.display = "none";
    renderSlots();
    toast("Appointment requested! The barber will confirm shortly.");
  } catch (e) {
    toast("Failed to submit. Please try again.", true);
  }
  btn.disabled = false;
  btn.textContent = "Request Appointment";
  loadingDone();
};

// ─── ADMIN: SCHEDULE ──────────────────────────────────────────────────────────
window.saveDefaultTime = async function () {
  const t = document.getElementById("cfg-default-time").value;
  if (!t) {
    toast("Please enter a valid time.");
    return;
  }
  state.defaultStartTime = t;
  await saveScheduleToDb();
  renderSlots();
  refreshAdminSlots();
  toast(`Default start time set to ${formatTime24(t)}`);
};

window.addOverride = async function () {
  const dk = document.getElementById("cfg-date").value;
  const t = document.getElementById("cfg-time").value;
  if (!dk || !t) {
    toast("Please select a date and time.");
    return;
  }
  state.scheduleOverrides[dk] = t;
  await saveScheduleToDb();
  renderOverrideList();
  renderSlots();
  refreshAdminSlots();
  toast(`Override saved: ${formatOverrideDate(dk)} → ${formatTime24(t)}`);
  document.getElementById("cfg-date").value = "";
  document.getElementById("cfg-time").value = "";
};

window.removeOverride = async function (dk) {
  delete state.scheduleOverrides[dk];
  await saveScheduleToDb();
  renderOverrideList();
  renderSlots();
  refreshAdminSlots();
  toast("Override removed.");
};

function renderOverrideList() {
  const el = document.getElementById("overrideList");
  const keys = Object.keys(state.scheduleOverrides).sort();
  if (!keys.length) {
    el.innerHTML =
      '<div style="font-size:13px;color:var(--text-muted);padding:6px 0;">No overrides set.</div>';
    return;
  }
  el.innerHTML = keys
    .map(
      (dk) => `
    <div class="override-item">
      <div><b>${formatOverrideDate(dk)}</b> <span>— starts at ${formatTime24(state.scheduleOverrides[dk])}</span></div>
      <button class="gold-btn danger" onclick="removeOverride('${dk}')">Remove</button>
    </div>
  `,
    )
    .join("");
}

window.refreshAdminSlots = function () {
  const dk = document.getElementById("a-date").value;
  const sel = document.getElementById("a-time");
  if (!dk) {
    sel.innerHTML = "<option disabled>Pick a date first</option>";
    return;
  }
  sel.innerHTML = getSlots(dk)
    .map((s) => `<option>${s}</option>`)
    .join("");
};

// ─── ADMIN: APPOINTMENTS ──────────────────────────────────────────────────────
window.adminAddAppointment = async function () {
  const fn = document.getElementById("a-fname").value.trim();
  const ln = document.getElementById("a-lname").value.trim();
  const date = document.getElementById("a-date").value;
  const time = document.getElementById("a-time").value;
  if (!fn || !ln || !date) {
    toast("Please fill in all required fields.");
    return;
  }
  if (
    state.appointments.find(
      (a) => a.date === date && a.time === time && a.status !== "declined",
    )
  ) {
    toast("That time slot is already taken.");
    return;
  }
  const btn = document.getElementById("adminSubmitBtn");
  btn.disabled = true;
  btn.textContent = "Saving…";
  loadingStart();
  try {
    const inserted = await sbInsert("appointments", {
      first_name: fn,
      last_name: ln,
      date,
      time,
      service: "Haircut",
      payment: "cash",
      comments: document.getElementById("a-comments").value.trim(),
      status: "approved",
      created_by: "admin",
    });
    state.appointments.push({
      id: inserted[0].id,
      firstName: fn,
      lastName: ln,
      date,
      time,
      service: "Haircut",
      payment: "cash",
      comments: document.getElementById("a-comments").value.trim(),
      status: "approved",
      createdBy: "admin",
    });
    document.getElementById("a-fname").value = "";
    document.getElementById("a-lname").value = "";
    document.getElementById("a-comments").value = "";
    renderApptList();
    renderSlots();
    toast("Appointment added and approved.");
  } catch (e) {
    toast("Failed to add appointment.", true);
  }
  btn.disabled = false;
  btn.textContent = "Add Appointment";
  loadingDone();
};

window.setTab = function (tab, el) {
  state.activeTab = tab;
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
  renderApptList();
};

function renderApptList() {
  const list = document.getElementById("apptList");
  const today = todayKey();
  let appts = [...state.appointments];

  // ── Tab filtering ──────────────────────────────────────────────────────────
  if (state.activeTab === "today") {
    // Today's appointments only, excluding declined
    appts = appts.filter((a) => a.date === today && a.status !== "declined");
  } else if (state.activeTab === "upcoming") {
    // Future appointments (not today, not past), excluding declined
    appts = appts.filter((a) => a.date > today && a.status !== "declined");
  } else if (state.activeTab === "pending") {
    // All pending regardless of date
    appts = appts.filter((a) => a.status === "pending");
  } else if (state.activeTab === "archive") {
    // Past appointments (before today) OR any declined
    appts = appts.filter((a) => a.date < today || a.status === "declined");
  }

  appts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (!appts.length) {
    const messages = {
      today: "No appointments today.",
      upcoming: "No upcoming appointments.",
      pending: "No pending appointments.",
      archive: "No archived appointments.",
    };
    list.innerHTML = `<div class="empty-state">${messages[state.activeTab] || "No appointments found."}</div>`;
    return;
  }

  list.innerHTML = appts
    .map((a) => {
      const bCls =
        a.status === "pending"
          ? "badge-pending"
          : a.status === "approved"
            ? "badge-approved"
            : "badge-declined";
      const iCls =
        a.status === "pending"
          ? "pending-item"
          : a.status === "approved"
            ? "approved-item"
            : "declined-item";

      const approveDecline =
        a.status === "pending"
          ? `
      <button class="gold-btn" onclick="updateAppt(${a.id}, 'approved')">Approve</button>
      <button class="gold-btn danger" onclick="updateAppt(${a.id}, 'declined')">Decline</button>`
          : "";

      const actions = `
      <div class="appt-actions">
        ${approveDecline}
        <button class="gold-btn danger" style="margin-left:auto;" onclick="deleteAppt(${a.id})">Delete</button>
      </div>`;

      const dateStr = new Date(a.date + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "short", month: "short", day: "numeric" },
      );
      const payPill = `<span class="pay-pill ${a.payment === "cash" ? "cash" : ""}">${a.payment === "cash" ? "Cash" : "e-Transfer"}</span>`;

      return `
      <div class="appt-item ${iCls}">
        <div class="appt-header">
          <div class="appt-name">${a.firstName} ${a.lastName}</div>
          <span class="badge ${bCls}">${a.status}</span>
        </div>
        <div class="appt-detail">
          ${dateStr} · ${a.time} · Haircut ${payPill}
          ${a.comments ? `<br><em>${a.comments}</em>` : ""}
        </div>
        ${actions}
      </div>`;
    })
    .join("");
}

window.updateAppt = async function (id, status) {
  loadingStart();
  try {
    await sbUpdate("appointments", { status }, `?id=eq.${id}`);
    const a = state.appointments.find((a) => a.id === id);
    if (a) {
      a.status = status;
      renderApptList();
      renderSlots();
    }
    toast(
      status === "approved" ? "Appointment approved." : "Appointment declined.",
    );
  } catch (e) {
    toast("Failed to update appointment.", true);
  }
  loadingDone();
};

window.deleteAppt = async function (id) {
  if (!confirm("Permanently delete this appointment? This cannot be undone."))
    return;
  loadingStart();
  try {
    await sbDelete("appointments", `?id=eq.${id}`);
    state.appointments = state.appointments.filter((a) => a.id !== id);
    renderApptList();
    renderSlots();
    toast("Appointment deleted.");
  } catch (e) {
    toast("Failed to delete appointment.", true);
  }
  loadingDone();
};

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
window.showView = function (id, btn) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  if (id === "admin-login") {
    if (state.isAdmin) openAdminView();
    else document.getElementById("view-admin-login").classList.add("active");
  } else {
    document.getElementById("view-customer").classList.add("active");
    renderSlots();
  }
};

function openAdminView() {
  document.getElementById("view-admin").classList.add("active");
  document.getElementById("cfg-default-time").value = state.defaultStartTime;
  renderOverrideList();
  document.getElementById("a-date").value = new Date()
    .toISOString()
    .split("T")[0];
  refreshAdminSlots();
  renderApptList();
}

window.doLogin = function () {
  if (document.getElementById("adminPwInput").value === ADMIN_PASSWORD) {
    state.isAdmin = true;
    document.getElementById("adminPwInput").value = "";
    document.getElementById("loginError").textContent = "";
    document
      .querySelectorAll(".nav-btn")
      .forEach((b) => b.classList.remove("active"));
    document.getElementById("navAdmin").classList.add("active");
    document
      .querySelectorAll(".view")
      .forEach((v) => v.classList.remove("active"));
    openAdminView();
    toast("Welcome back!");
  } else {
    document.getElementById("loginError").textContent = "Incorrect password.";
  }
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast" + (isError ? " error" : "");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadState();
