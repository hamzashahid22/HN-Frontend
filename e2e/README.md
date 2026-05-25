# Real-Device E2E Suite

This suite uses Maestro against an Expo development build.

## Prerequisites

- Maestro CLI installed and on `PATH`.
- Android SDK/ADB installed for Android device runs.
- A connected Android device/emulator, or iOS simulator/device on macOS.
- Backend services running and reachable from the device.
- Expo development build installed on the device.

Until the real native Signal/libsignal provider is complete, build the dev client with:

```powershell
$env:HN_ALLOW_INSECURE_CRYPTO_STUB="true"
$env:HN_API_BASE_URL="http://<your-host-lan-ip>:4000"
npm run android
```

Do not use the insecure crypto stub for production or private beta.

## Start Backend

From `HM-Backend`:

```powershell
docker compose up -d postgres redis kafka clamav livekit
npm run prisma:deploy
npm run dev
```

In another terminal:

```powershell
npm run worker:dev
```

## Seed Test Data

From `HM-Backend`:

```powershell
$env:E2E_API_BASE_URL="http://localhost:4000"
npm run e2e:seed
```

This writes:

```text
HM-Frontend/e2e/maestro/.env.generated.json
```

## Run Maestro

From `HM-Frontend`:

```powershell
.\e2e\run-maestro.ps1
```

To run one flow:

```powershell
.\e2e\run-maestro.ps1 -FlowPath .\e2e\maestro\02_direct_message.yaml
```

## Current Flows

- `00_signup_smoke.yaml`: signup and land on Chats.
- `01_login_smoke.yaml`: login and land on Chats.
- `02_direct_message.yaml`: create direct chat and send a message.
- `03_group_create_and_message.yaml`: create group and send a group message.
- `04_cache_relaunch_sync.yaml`: verify message remains visible after relaunch.
- `05_audio_call_launch.yaml`: start direct audio call and reach the call screen.

## Real Two-Device Acceptance Still Required

After native libsignal is complete, run the manual/two-device matrix:

- Device A signs up, Device B signs up.
- A sends direct encrypted text to B; B decrypts.
- A creates group with B; both decrypt group message.
- B is removed from group; B cannot decrypt future group messages.
- A starts direct audio call; B receives native call UI and joins.
- A starts group audio call; all invited members receive call notification.
- Turn off network on A, send message, restore network, queued message syncs.
- Send push while app is backgrounded; tap opens chat/call.
