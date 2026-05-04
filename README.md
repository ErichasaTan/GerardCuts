# GerardCuts ✂️

A full-stack barbershop appointment booking web app built with Vite and Supabase. Customers can browse available time slots and request appointments, while the barber manages everything through a password-protected admin dashboard.

---

## Features

### Customer Side
- Browse available time slots starting from today (no past date navigation)
- 45-minute interval time slots with a configurable daily start time
- Request appointments with first name, last name, and optional comments
- Choose between **Cash** or **e-Transfer** as payment method
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
- Data persists in real time via Supabase (PostgreSQL)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, HTML, CSS |
| Build tool | [Vite](https://vitejs.dev/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Hosting | [Netlify](https://netlify.com/) |

---

## Project Structure

```
GerardCuts/
├── index.html          # App entry point
├── netlify.toml        # Netlify build config
├── .env.example        # Environment variable template
├── .gitignore
└── src/
    ├── main.js         # All app logic and UI rendering
    ├── style.css       # All styles
    └── supabase.js     # Supabase API helper functions
```

---

## Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ErichasaTan/GerardCuts.git
   cd GerardCuts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your `.env` file**
   ```bash
   cp .env.example .env
   ```
   Then fill in your values:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_PASSWORD=your_admin_password
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

---

## Supabase Setup

Run the following in your Supabase **SQL Editor** to create the required tables and policies:

```sql
-- Appointments table
create table appointments (
  id bigint generated always as identity primary key,
  first_name text not null,
  last_name text not null,
  date text not null,
  time text not null,
  service text default 'Haircut',
  payment text default 'cash',
  comments text default '',
  status text default 'pending',
  created_by text default 'customer',
  created_at timestamptz default now()
);

-- Schedule settings table (single row)
create table schedule_settings (
  id int primary key default 1,
  default_start_time text default '16:00',
  overrides jsonb default '{}'::jsonb
);

-- Insert default settings
insert into schedule_settings (id, default_start_time, overrides)
values (1, '16:00', '{}');

-- Row Level Security
alter table appointments enable row level security;
alter table schedule_settings enable row level security;

create policy "Public can read appointments" on appointments for select using (true);
create policy "Public can insert appointments" on appointments for insert with check (true);
create policy "Public can update appointments" on appointments for update using (true);
create policy "Public can delete appointments" on appointments for delete using (true);

create policy "Public can read settings" on schedule_settings for select using (true);
create policy "Public can update settings" on schedule_settings for update using (true);
```

---

## Deployment (Netlify)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from GitHub**
3. Select the `GerardCuts` repository
4. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add environment variables in Netlify's dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
6. Click **Deploy**

After deploying, add your Netlify URL to **Supabase → Authentication → URL Configuration** to allow database requests from your live domain.

Future deployments are automatic — every `git push` triggers a rebuild.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |
| `VITE_ADMIN_PASSWORD` | Password to access the admin dashboard |

> ⚠️ Never commit your `.env` file to GitHub. It is listed in `.gitignore` by default.

---

## License

This project is private and intended for personal business use.
