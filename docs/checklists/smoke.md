# Smoke Checklist

Minimum checks required before tagging a release or deploying.

## Auth
- Login works with a valid user
- Logout clears session and returns to Login
- Session persists after page refresh

## Reservations
- Create reservation succeeds and appears in "Mis Reservas"
- Availability updates in Home after creating a reservation
- Cancel reservation succeeds and disappears from "Próximas"
- Cancelled reservation appears in "Pasadas"

## Schedule Config
- Admin can save schedule config
- Weekday/weekend hours show correctly in Home
- Break times remove slots correctly

## Tablon (Announcements/Notifications)
- Open admin announcement and "Entendido" marks it as read
- Bulletin badge updates after reading

## Matches
- Create match succeeds
- Cancel match succeeds and users are notified

## Profile
- Change profile photo works (web/PWA preview)
- Save profile updates persist
