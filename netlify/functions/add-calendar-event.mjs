import { google } from 'googleapis';

export default async function handler(req, context) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { firstName, lastName, date, time, comments } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !date || !time) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Auth ───────────────────────────────────────────────────────────────
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // ── Parse date & time into a proper datetime ───────────────────────────
    // time is like "4:00 PM", date is like "2026-05-10"
    const [timePart, meridiem] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const startDateTime = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const endDateTime   = new Date(startDateTime.getTime() + 45 * 60 * 1000); // 45 min later

    // ── Build event description ────────────────────────────────────────────
    const descriptionLines = [`Service: Haircut`];
    if (comments) descriptionLines.push(`Notes: ${comments}`);

    // ── Create the calendar event ──────────────────────────────────────────
    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `✂️ ${firstName} ${lastName} — Haircut`,
        description: descriptionLines.join('\n'),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Vancouver',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Vancouver',
        },
        colorId: '5', // Banana yellow — fits the gold theme
      },
    });

    return new Response(JSON.stringify({ success: true, eventId: event.data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Calendar error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = {
  path: '/api/add-calendar-event',
};
