# NahkriinOS VPS Download and Updates

This setup publishes only public installer files, release metadata, and a small download page. NahkriinOS still runs locally after installation and does not depend on the VPS.

## Local Build

```powershell
npm run release
```

This builds the Windows installer and portable executable, then creates:

- `release/public/index.html`
- `release/public/latest.json`
- `release/public/releases/latest/NahkriinOS-Setup.exe`
- `release/public/releases/latest/NahkriinOS-Portable.exe`
- `release/public/releases/<version>/...`

Set the public base URL before creating metadata:

```powershell
$env:NAHKRIINOS_DOWNLOAD_BASE_URL = "https://downloads.example.com"
npm run release
```

Optional release notes:

```powershell
$env:NAHKRIINOS_RELEASE_NOTES = "Storage scanner improvements and update checker."
npm run release
```

## VPS Packages

Ubuntu example:

```bash
sudo apt update
sudo apt install -y nginx openssh-server
```

For HTTPS with a domain:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

## Folder Structure

Recommended public root:

```bash
sudo mkdir -p /var/www/nahkriinos/releases
sudo chown -R "$USER":www-data /var/www/nahkriinos
sudo chmod -R 755 /var/www/nahkriinos
```

Alternative user-owned root:

```bash
mkdir -p /home/ubuntu/nahkriinos/releases
```

## Nginx Site

Create `/etc/nginx/sites-available/nahkriinos`:

```nginx
server {
    listen 80;
    server_name downloads.example.com;

    root /var/www/nahkriinos;
    index index.html;

    location = /download/latest {
        return 302 /releases/latest/NahkriinOS-Setup.exe;
    }

    location = /latest.json {
        add_header Cache-Control "no-store";
        try_files /latest.json =404;
    }

    location /releases/ {
        autoindex on;
        try_files $uri =404;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/nahkriinos /etc/nginx/sites-enabled/nahkriinos
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS

After DNS points to the VPS:

```bash
sudo certbot --nginx -d downloads.example.com
```

Use HTTPS before public sharing so downloads and `latest.json` are protected in transit.

## Deploy From Windows

Use SSH keys, not passwords committed to the repo.

```powershell
$env:NAHKRIINOS_DOWNLOAD_BASE_URL = "https://downloads.example.com"
npm run release

$env:VPS_HOST = "downloads.example.com"
$env:VPS_USER = "ubuntu"
$env:VPS_RELEASE_DIR = "/var/www/nahkriinos"
$env:VPS_SSH_KEY = "$env:USERPROFILE\.ssh\id_ed25519"
npm run deploy:vps
```

If your SSH agent already has the key loaded, `VPS_SSH_KEY` can be omitted.

## In-App Update Feed

In NahkriinOS, open **Updates** and set:

```text
https://downloads.example.com/latest.json
```

The app checks this feed, compares the remote version to its packaged version, and opens the download URL when you choose to update. Updates are never forced.

`latest.json` contains:

- `version`
- `downloadUrl`
- `portableUrl`
- `releaseNotes`
- `fileSize`
- `portableFileSize`
- `publishedAt`
- `sha256`
- `portableSha256`

## Verify

```bash
curl -I https://downloads.example.com/
curl https://downloads.example.com/latest.json
curl -L -o NahkriinOS-Setup.exe https://downloads.example.com/download/latest
sha256sum NahkriinOS-Setup.exe
```

Compare the hash to `latest.json`.

## Publishing a New Release

1. Update `version` in `package.json`.
2. Add release notes through `CHANGELOG.md` or `NAHKRIINOS_RELEASE_NOTES`.
3. Run `npm run release`.
4. Run `npm run deploy:vps`.
5. Verify `/latest.json`, `/download/latest`, and the download page.

Older versioned releases remain in `/releases/<version>/` as long as you do not delete them from the VPS.

## Security Notes

- Do not commit SSH keys, server passwords, or deployment tokens.
- Prefer HTTPS before sharing the public URL.
- The app stores only the public update feed URL.
- SHA256 hashes are published for manual verification. Automatic binary verification before launching the installer is a future improvement.
