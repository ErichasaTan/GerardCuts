# GerardCuts ✂️

A barbershop appointment booking web app for customers to browse and request time slots, and for the barber to manage their schedule through a private admin dashboard.

**Live since:** May 2026
**Users:** 2

---

## Features

### Customer Side
- Browse available time slots starting from today — no past date navigation
- 45-minute interval time slots with a configurable daily start time
- Request appointments with first name, last name, and optional comments
- Choose between **Cash** or **e-Transfer** as a payment method
- e-Transfer flow displays the payment email with a one-click copy button
- Pending and booked slots are visually distinguished so customers know what's available

### Admin Side
- Password-protected admin dashboard
- **Today** tab — see only today's appointments at a glance
- **Upcoming** tab — all future confirmed appointments
- **Pending** tab — customer requests waiting for approval or decline
- **Archive** tab — past appointments and declined bookings, kept for records
- Approve or decline customer booking requests
- Manually add appointments directly (auto-approved)
- Delete individual appointments permanently
- **Schedule Settings** — set a global default start time (e.g. 4:00 PM)
- **Date Overrides** — set a different start time for specific dates (e.g. Thursdays at 6:00 PM)

### General
- Live database connection indicator in the header
- Animated loading bar on every database operation
- Fully responsive — works on desktop and mobile
- Data persists in real time via Supabase

---

## Technologies Used

- **Vite** — frontend build tool
- **Vanilla JavaScript, HTML, CSS** — no frameworks
- **Supabase** — PostgreSQL cloud database and REST API
- **Netlify** — hosting and continuous deployment
- **GitHub** — version control
