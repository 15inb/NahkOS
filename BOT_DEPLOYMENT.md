# NahkriinOS Discord Reminder Bot VPS Deployment

The reminder bot runs on the VPS so due reminders still send by Discord DM when the desktop PC is off. The desktop app syncs reminders to this backend, and the bot owns due-checking and delivery.

## What Runs on the VPS

- Discord bot login and slash commands.
- SQLite reminder database.
- Due reminder checker every 30 seconds.
- Authenticated HTTP sync API for NahkriinOS desktop.
- PM2 or systemd process supervision.

## Required Environment Variables

Create `/home/ubuntu/nahkriinos-bot/bot/.env`:

```bash
DISCORD_BOT_TOKEN=
DISCORD_TARGET_USER_ID=203025242753335296
REMINDER_TIME_ZONE=America/New_York
DATABASE_URL=file:/home/ubuntu/nahkriinos-bot/reminders.sqlite
BOT_API_TOKEN=make-a-long-random-secret
BOT_API_PORT=47822
BOT_API_HOST=127.0.0.1
```

Never commit `.env`. The desktop app only needs the public backend URL and `BOT_API_TOKEN`; it does not need the Discord bot token.

`REMINDER_TIME_ZONE` controls how `/remind add due:"tomorrow at 7pm"` is interpreted and how due dates are shown in Discord. Use an IANA timezone such as `America/New_York`.

## Ubuntu Setup with PM2

```bash
sudo apt update
sudo apt install -y git curl build-essential nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

cd /home/ubuntu
git clone YOUR_REPO_URL nahkriinos-bot
cd /home/ubuntu/nahkriinos-bot/bot
cp .env.example .env
nano .env
npm install --omit=dev
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup` so the bot restarts after a VPS reboot.

## Nginx Reverse Proxy

Expose only the bot API through Nginx. Example:

```nginx
server {
    listen 80;
    server_name your-domain.example.com;

    location /reminders/ {
        proxy_pass http://127.0.0.1:47822/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/nahkriinos /etc/nginx/sites-enabled/nahkriinos
sudo nginx -t
sudo systemctl reload nginx
```

Use HTTPS before public use:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

Your desktop backend URL becomes:

```text
https://your-domain.example.com/reminders
```

## PM2 Commands

```bash
pm2 status
pm2 logs nahkriinos-reminder-bot
pm2 restart nahkriinos-reminder-bot --update-env
pm2 save
```

## Optional systemd Service

PM2 is simpler, but systemd also works:

```ini
[Unit]
Description=NahkriinOS Discord Reminder Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/nahkriinos-bot/bot
EnvironmentFile=/home/ubuntu/nahkriinos-bot/bot/.env
ExecStart=/usr/bin/node /home/ubuntu/nahkriinos-bot/bot/index.mjs
Restart=always
RestartSec=5
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Save it as `/etc/systemd/system/nahkriinos-reminder-bot.service`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nahkriinos-reminder-bot
sudo systemctl status nahkriinos-reminder-bot
```

## Deploy Updates

The recommended deployment flow is GitHub-based:

1. Commit and push changes from the Windows PC.
2. SSH into the VPS.
3. Run `git pull --ff-only`.
4. Restart the bot with PM2.

On the VPS:

```bash
cd /home/ubuntu/nahkriinos-bot
git pull --ff-only
cd bot
npm install --omit=dev
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
```

Or run the helper from the repo root:

```bash
APP_DIR=/home/ubuntu/nahkriinos-bot bash scripts/vps-update-reminder-bot.sh
```

From Windows, set the VPS host using Command Prompt syntax:

```cmd
set VPS_HOST=15.204.119.230
set VPS_USER=ubuntu
set VPS_BOT_DIR=/home/ubuntu/nahkriinos-bot
npm run deploy:bot:vps
```

PowerShell syntax is different:

```powershell
$env:VPS_HOST="15.204.119.230"
$env:VPS_USER="ubuntu"
$env:VPS_BOT_DIR="/home/ubuntu/nahkriinos-bot"
npm run deploy:bot:vps
```

The script runs `git pull`, installs bot dependencies, and restarts PM2.

## Discord Slash Commands

- `/remind add title due notes priority category`
- `/remind list`
- `/remind complete id`
- `/remind delete id`
- `/remind snooze id due`
- `/remind testdm`

The `/remind` command is registered globally with guild install, user install, server, bot-DM, and private-channel contexts. That lets it appear in servers and DMs once Discord has propagated the global command update.

Only Discord user `203025242753335296` can use the commands. Other users receive a private denial.

If the command does not show in DMs:

1. Open the Discord Developer Portal.
2. Select the NahkriinOS reminder bot application.
3. Confirm the app can be installed by users if you want private/user-install commands.
4. Reinstall/reinvite the app with the `applications.commands` scope. For servers, include the `bot` scope too.
5. Restart the VPS bot so it re-registers global commands.

## Desktop Sync

In NahkriinOS settings, open **Discord Reminder Backend** and set:

- Backend URL: `https://your-domain.example.com/reminders`
- Backend API token: the same value as `BOT_API_TOKEN`
- Target user ID: `203025242753335296`

Reminders created in NahkriinOS sync to the VPS. Reminders created through Discord slash commands sync back into NahkriinOS the next time the app opens or on the next sync interval.

## End-to-End Test

1. Start the bot with PM2.
2. Run `/remind testdm` in Discord.
3. Run `/remind add title:"Pay bills" due:"in 2 minutes"`.
4. Confirm the reminder appears in NahkriinOS after **Sync now**.
5. Create a reminder in NahkriinOS due in 2 minutes.
6. Close NahkriinOS or turn off the PC.
7. Confirm the VPS bot sends exactly one Discord DM.
8. Restart the VPS and confirm `pm2 status` shows the bot online again.

Duplicate DMs are prevented by storing `discordNotificationStatus`, `discordNotificationSentAt`, and `discordNotificationError` in SQLite. Failed sends stay `failed` until manually retried or snoozed.
