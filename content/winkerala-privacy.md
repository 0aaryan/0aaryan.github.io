---
title: "Privacy Policy — WinKerala"
date: 2026-05-16
draft: false
description: "Privacy policy for the WinKerala Kerala State Lottery results Android app."
---

_Last updated: May 16, 2026_

WinKerala is a free Android app that lets you check Kerala State Lottery results and save your tickets so you get a notification the moment a draw is published. This page explains, plainly, what data the app touches, where it goes, and what rights you have over it.

## TL;DR

- **No account, no email, no name, no phone number.** You are anonymous from the first launch.
- **No analytics SDKs that profile you.** We use Firebase Crashlytics (off by default in dev) for crash reports — these contain no personally identifiable information.
- **Saved tickets stay private to your device.** They sync to a Firestore record keyed by an anonymous ID generated on your phone — only your phone can see them.
- **Camera permission is used only when you tap the scan button.** Photos are never saved or sent.
- **Ads are limited to one banner at the bottom of Settings.** They use Google AdMob's standard non-personalised serving.
- **No data is sold.** Ever.

## What we collect

| Data | Why | Where it goes | Linked to you? |
|---|---|---|---|
| Anonymous Firebase Auth UID | So your saved tickets follow you across reinstalls | Google Firebase (Asia-South1) | No PII |
| Saved ticket numbers (e.g. `KR 752345`) | To check them automatically when results publish | Google Firestore (Asia-South1) | Tied to your anonymous UID only |
| Notification preferences | To send you push alerts when a saved ticket's draw publishes | Firebase Cloud Messaging | Tied to your anonymous UID only |
| Crash reports (stack traces, device model, OS version) | So we can fix bugs that affect you | Firebase Crashlytics | Anonymous |
| App language preference, theme choice | To remember your settings between launches | Stored on your device only | Not transmitted |

## What we do NOT collect

- Your name, email, phone number, address — we never ask for them
- Your contacts, calendar, photos, location, microphone, or files
- Browsing history, ad clicks, third-party tracking IDs
- Photographs from the scanner — the camera frame is processed for the barcode/QR pattern in real time and discarded immediately

## Camera permission

Tapping the scan icon on the Check tab opens the camera so the app can read the barcode or QR code on your lottery ticket. The frame goes straight into Google's on-device ML Kit barcode reader and is never written to disk or sent to a server. You can revoke camera permission at any time from your phone's **Settings → Apps → WinKerala → Permissions**.

## Notifications

If you save a ticket and turn on the bell, the app subscribes to a Firebase Cloud Messaging topic for that draw's lottery family (e.g. "Karunya"). When a new result publishes, our backend triggers a push to that topic. Notifications can be disabled in your phone's **Settings → Apps → WinKerala → Notifications** at any time.

## Ads

WinKerala displays a single banner ad at the bottom of the Settings tab via Google AdMob. AdMob's privacy disclosures and opt-out controls are at <https://policies.google.com/technologies/ads>. The Check, Saved, and Result screens are intentionally ad-free. We do not use any other advertising network.

## Children's privacy

WinKerala is not directed to children under 13 and does not knowingly collect data from them. The app contains no in-app purchases and the lottery content is for informational use only — actual lottery purchase and prize claim happens with the Kerala State Lotteries Directorate.

## Where your data lives

All cloud data is stored in **Google Firebase (region: asia-south1, Mumbai, India)**. The Firebase service is operated by Google LLC; their data-protection terms apply.

## Your rights

Because we don't collect any personally identifiable information, there is nothing to "export" or "log in to delete." However:

- **Stop syncing tickets** → uninstall the app, then reinstall (a new anonymous UID is generated; the old Firestore record orphans and is auto-deleted after 30 days of inactivity)
- **Delete a single saved ticket** → swipe-to-delete on the Saved tab
- **Reset the app** → Phone Settings → Apps → WinKerala → **Storage → Clear data**
- **Stop notifications** → toggle the bell off on each saved ticket, or disable notifications system-wide

## Changes to this policy

If we change anything, we'll bump the date at the top and post the updated text here. Material changes (new data collected, new third party) will trigger an in-app notice when you next open the app.

## Contact

Questions or concerns? Email us at <aroraryan826@gmail.com> with the subject "WinKerala privacy" and we'll respond within seven days.

---

_WinKerala is built and maintained by an independent developer. The app is not affiliated with, endorsed by, or operated by the Kerala State Lotteries Directorate. Lottery result data is publicly published by the directorate._
