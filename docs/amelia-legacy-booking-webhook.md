# Legacy Amelia booking integration

The Free Strategy Call scheduler now loads the Amelia booking page at:

```text
https://old.betterlsat.com/booking/free-test-session/
```

Amelia creates the Zoom meeting and sends the appointment email. To show the
same appointment in BetterLSAT, configure an Amelia webhook that mirrors each
booking to the deployed Supabase Edge Function.

## One-time configuration

1. In Supabase production secrets, set `AMELIA_WEBHOOK_SECRET` to a strong,
   random value. Do not put this value in the web application or source code.
2. In the Amelia/WordPress administration area for `old.betterlsat.com`, add a
   webhook for appointment booking creation and status changes. Use this URL,
   replacing `<secret>` with that same production secret:

   ```text
   https://ymitqvbxrauychrkkhqp.supabase.co/functions/v1/amelia-webhook?secret=<secret>
   ```

3. Configure the webhook to send `POST` JSON and to run after the appointment
   has been created, so the payload includes its booking data and Zoom details.
   Also send cancellation/status-change events to the same URL.
4. In Amelia's **Notifications**, enable the customer “appointment booked”
   email for the **15-Minute FREE Strategy Call** service. Include Amelia's
   Zoom/online-meeting placeholder in that template.

## Matching and verification

- The Amelia customer email must exactly match the email on the student's
  BetterLSAT profile. This is how the webhook associates an external booking
  with the signed-in student.
- Make one test booking using a test BetterLSAT account. Confirm:
  1. Amelia sends the appointment email with a Zoom join link.
  2. `tutoring_sessions` has a row with `status = scheduled`.
  3. The session appears at `/app/tutoring/sessions`.
- Use Amelia's webhook delivery log to retry any failed delivery. A successful
  response is JSON containing `"ok": true`.

The Edge Function is already deployed as `amelia-webhook`. Its endpoint
requires the secret when `AMELIA_WEBHOOK_SECRET` is configured.
