# SecureMail Mobile — Dark Theme & Push Notification Implementation Report

## 1. Overview & Architecture Summary

The SecureMail mobile application and backend have been upgraded to support:
1. **Complete Dynamic Dark Theme**: Supports `light`, `dark`, and `system` modes. Theme preference is persisted in Expo `SecureStore` (never `AsyncStorage`), and automatically respects iOS/Android system dark scheme changes when set to `system`.
2. **Production Push Notification System**: Real-time push notification architecture driven completely by Flask REST APIs (`/api/mobile/*`) and persistent database tables (`devices`, `notifications`, `notification_queue`).

---

## 2. Modified & Created Files

### Backend (`app.py`):
- Added `# MOBILE SUPPORT UPDATE` annotated sections for:
  - Database table creation (`devices`, `notifications`, `notification_queue`) in `init_db()`.
  - Notification trigger on new email creation in `/api/emails` (POST).
  - Push Token Registration API (`POST /api/mobile/register-push-token`).
  - Push Token Unregistration API (`POST /api/mobile/remove-push-token`).
  - Mobile Notifications Listing API (`GET /api/mobile/notifications`).
  - Mark Notifications Read API (`PUT /api/mobile/notifications/read`).
  - Notification Deletion API (`DELETE /api/mobile/notifications/<int:id>`).
  - Test Notification Trigger API (`POST /api/mobile/test-notification`).

### Mobile Frontend (`Mobile/src/`):
- `context/ThemeContext.js` [NEW]: Dynamic theme provider hook (`useTheme()`) with `light`, `dark`, `system` mode support and `SecureStore` persistence.
- `theme/theme.js`: Expanded `LIGHT_COLORS` and `DARK_COLORS` palette tokens meeting WCAG AA contrast standards.
- `utils/pushNotificationHandler.js` [NEW]: Handlers for `expo-notifications` token registration, background/foreground listeners, and deep-linking.
- `services/notificationService.js`: Upgraded from stub to full Flask REST backend API client.
- `services/api.js`: Mapped `/api/mobile/*` endpoints.
- `constants/constants.js`: Mapped `MOBILE` endpoints and `PUSH_TOKEN` storage key.
- `utils/secureStorage.js`: Added `setPushToken`, `getPushToken`, `clearPushToken`.
- `App.js`: Wrapped tree with `ThemeProvider` and dynamic `StatusBar` style.
- `context/AppContext.js`: Managed global unread notification counts.
- `screens/Settings/SettingsScreen.js`: Interactive Theme selector (`Light` | `Dark` | `System`) and Push Notifications toggle.
- `screens/Notifications/NotificationsScreen.js`: Connected to backend REST notification endpoints with pull-to-refresh, mark-as-read, delete, and deep-linking to emails.
- `screens/Auth/LoginScreen.js`, `RegisterScreen.js`, `ForgotPasswordScreen.js`, `InboxScreen.js`, `EmailDetailScreen.js`, `ComposeScreen.js`, `ProfileScreen.js`, `SecurityCenterScreen.js`, `MainTabs.js`, and common UI components (`Header`, `Card`, `EmailCard`, `Button`, `Input`, `LoadingSkeleton`, `EmptyView`, `ErrorView`, `Loader`, `SearchBar`, `Toast`): Fully integrated with `useTheme()` for responsive light/dark rendering.

---

## 3. Backend Modification Header Sample

All backend edits in `app.py` include the required header comment:

```python
###############################################################
# MOBILE SUPPORT UPDATE
# Added for React Native Mobile Application
# Purpose:
# Initialize database tables for Mobile Device Push Tokens,
# Mobile Notifications, and Mobile Push Delivery Queue.
# Do not remove without updating the mobile application.
###############################################################
```

---

## 4. REST API Documentation

| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/mobile/register-push-token` | Register Expo Push Token | `{"push_token": "ExpoPushToken[...]", "platform": "android"}` |
| `POST` | `/api/mobile/remove-push-token` | Unregister Push Token | `{"push_token": "ExpoPushToken[...]"}` |
| `GET` | `/api/mobile/notifications` | Fetch user notifications & unread count | None (JWT Bearer Token) |
| `PUT` | `/api/mobile/notifications/read` | Mark notification(s) as read | `{"notification_id": 123}` (omit ID to mark all read) |
| `DELETE` | `/api/mobile/notifications/<id>` | Delete specific notification | None (JWT Bearer Token) |
| `POST` | `/api/mobile/test-notification` | Dispatch test alert to user | None (JWT Bearer Token) |

---

## 5. Database Schema Additions

### `devices`
- `id` INT/INTEGER AUTO_INCREMENT PRIMARY KEY
- `user_email` VARCHAR(255) NOT NULL
- `push_token` VARCHAR(255) NOT NULL
- `platform` VARCHAR(50) DEFAULT 'unknown'
- `is_active` BOOLEAN/INTEGER DEFAULT 1
- `created_at`, `updated_at` TIMESTAMP

### `notifications`
- `id` INT/INTEGER AUTO_INCREMENT PRIMARY KEY
- `user_email` VARCHAR(255) NOT NULL
- `title` VARCHAR(255) NOT NULL
- `body` TEXT NOT NULL
- `type` VARCHAR(50) DEFAULT 'info'
- `data_json` TEXT NULL
- `is_read` BOOLEAN/INTEGER DEFAULT 0
- `created_at` TIMESTAMP

### `notification_queue`
- `id` INT/INTEGER AUTO_INCREMENT PRIMARY KEY
- `user_email` VARCHAR(255) NOT NULL
- `title`, `body`, `type`, `data_json` TEXT
- `status` VARCHAR(50) DEFAULT 'pending'
- `created_at` TIMESTAMP

---

## 6. Security Review

- **No Secrets in Push Payloads**: Notifications convey only metadata (`title`, `body_preview`, `email_id`). Plaintext passwords, OTPs, private keys, and full decrypted email content are strictly excluded.
- **Secure Preference Persistence**: `themeMode` and push tokens are saved exclusively in `SecureStore` (never `AsyncStorage`).
- **Single Source of Truth**: All notifications and unread counts originate from Flask + MySQL/SQLite.

---

## 7. Verification & Testing Checklist

- [x] Backend syntax validation (`python -m py_compile app.py`) passed cleanly.
- [x] All backend modifications contain `# MOBILE SUPPORT UPDATE` comment headers.
- [x] `ThemeContext` restores persisted mode on startup from `SecureStore`.
- [x] System theme mode dynamically responds to device color scheme changes.
- [x] SettingsScreen theme buttons allow manual override between Light, Dark, and System modes.
- [x] All mobile screens and components dynamically adapt colors upon theme toggle.
- [x] NotificationsScreen fetches live notifications from backend `/api/mobile/notifications`.
- [x] Tapping a notification marks it read on backend and deep links to the email.
- [x] Web frontend code, HTML templates, and web CSS remain 100% untouched.
