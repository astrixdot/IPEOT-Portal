import ldap from "ldapjs";

const { createClient } = ldap;

export function ldapEscapeFilter(value) {
  return String(value).replace(/[\\*()\u0000]/g, (char) => `\\${char.charCodeAt(0).toString(16).padStart(2, "0")}`);
}

export class LdapError extends Error {
  constructor(kind, cause) {
    super(kind);
    this.kind = kind;
    this.cause = cause;
  }
}

function isInvalid(err) {
  return err?.name === "InvalidCredentialsError" || err?.code === 49;
}

function openClient() {
  const client = createClient({
    url: process.env.LDAP_URL,
    timeout: 8000,
    connectTimeout: 8000,
    reconnect: false,
  });
  return client;
}

function bind(client, dn, password) {
  return new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    client.once("error", onError);
    client.bind(dn, password, (err) => {
      client.removeListener("error", onError);
      if (err) reject(err);
      else resolve();
    });
  });
}

function searchDn(client, username) {
  const template = process.env.LDAP_USER_FILTER || "(sAMAccountName={{username}})";
  const filter = template.replaceAll("{{username}}", ldapEscapeFilter(username));
  return new Promise((resolve, reject) => {
    client.search(
      process.env.LDAP_BASE_DN,
      { scope: "sub", filter, attributes: ["dn"], sizeLimit: 2 },
      (err, res) => {
        if (err) return reject(err);
        const dns = [];
        res.on("searchEntry", (entry) => {
          const dn = entry.dn?.toString?.() || entry.objectName || "";
          if (dn) dns.push(String(dn));
        });
        res.on("error", reject);
        res.on("end", () => resolve(dns));
      },
    );
  });
}

export async function authenticateLdap(username, password) {
  if (!password) throw new LdapError("invalid");
  const suffix = process.env.LDAP_UPN_SUFFIX;
  const client = openClient();
  try {
    if (suffix) {
      await bind(client, `${username}@${suffix}`, password);
      return;
    }
    if (!process.env.LDAP_BIND_DN || !process.env.LDAP_BASE_DN) {
      throw new LdapError("unavailable");
    }
    await bind(client, process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD || "");
    const dns = await searchDn(client, username);
    if (dns.length !== 1) throw new LdapError("invalid");
    await bind(client, dns[0], password);
  } catch (err) {
    if (err instanceof LdapError) throw err;
    if (isInvalid(err)) throw new LdapError("invalid", err);
    throw new LdapError("unavailable", err);
  } finally {
    client.destroy();
  }
}
