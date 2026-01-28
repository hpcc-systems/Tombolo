import logger from './logger.js';
import akeyless from 'akeyless';

const client = new akeyless.ApiClient();
client.basePath = process.env.AKEYLESS_API_URL;
const api = new akeyless.V2Api(client);

async function getToken() {
  if (!process.env.AKEYLESS_ACCESS_ID || !process.env.AKEYLESS_ACCESS_KEY) {
    const errorMsg =
      'Missing AKEYLESS_ACCESS_ID or AKEYLESS_ACCESS_KEY in .env';
    logger?.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const authReq = {
      'access-id': process.env.AKEYLESS_ACCESS_ID,
      'access-key': process.env.AKEYLESS_ACCESS_KEY,
    };
    const authRes = await api.auth(authReq);
    return authRes.token;
  } catch (err) {
    logger?.error('Failed to get Akeyless token:', err);
    throw err;
  }
}

async function listSecrets(path = process.env.AKEYLESS_PATH_PREFIX) {
  if (!path) {
    const errorMsg = 'AKEYLESS_PATH_PREFIX is not defined in .env';
    logger?.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const tok = await getToken();
    const req = { path, token: tok };
    const res = await api.listItems(req);
    return res.items || [];
  } catch (err) {
    logger?.error(`Failed to list secrets in ${path}:`, err);
    return [];
  }
}

async function fetchAllSecretsInPath(path = process.env.AKEYLESS_PATH_PREFIX) {
  const items = await listSecrets(path);
  return items
    .filter(item => item.item_type === 'STATIC_SECRET')
    .map(item => item.item_name);
}

async function getSecret(name) {
  try {
    const tok = await getToken();
    const req = { names: [name], token: tok };
    const res = await api.getSecretValue(req);

    const value =
      res?.value || res?.secrets?.[name] || res?.secrets?.value || res?.[name];
    return value;
  } catch (err) {
    logger?.error(`Failed to fetch ${name} from Akeyless:`, err.message);
    return null;
  }
}

async function preloadSecrets() {
  try {
    const secretNames = await fetchAllSecretsInPath();
    logger?.info(
      `Found ${secretNames.length} secrets in Akeyless ${process.env.AKEYLESS_PATH_PREFIX}`
    );

    for (const fullName of secretNames) {
      const value = await getSecret(fullName);
      if (value) {
        const envName = fullName.replace(
          new RegExp(
            `^${process.env.AKEYLESS_PATH_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?`
          ),
          ''
        );
        if (!process.env[envName]) {
          process.env[envName] = value;
        } else {
          logger?.info(
            `Skipped process.env.${envName} (already defined in .env)`
          );
        }
      }
    }
  } catch (err) {
    logger?.error('Failed to preload secrets from Akeyless path:', err);
  }
}

export { getSecret, preloadSecrets };
