# TLS for IPEOT HAProxy (port 9643)

For local HTTPS, generate a self-signed PEM (cert + key in one file):

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=ipeot.local"
cat cert.pem key.pem > ipeot.pem
```

Or symlink/copy an org cert as `ipeot.pem`. HTTP-only dev works on port **8280** without valid TLS.
