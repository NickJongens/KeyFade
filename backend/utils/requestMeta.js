const getClientIp = (req) => {
  const cloudflareIp = req.headers['cf-connecting-ip'];
  if (cloudflareIp) return String(cloudflareIp).trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();

  if (req.ip) return String(req.ip).replace(/^::ffff:/, '');
  return 'unknown';
};

const getSanitizedPath = (req) => {
  let path = String(req.originalUrl || req.path || '');
  const { id, key } = req.params || {};

  if (id) {
    path = path.replace(id, ':id');
  }
  if (key) {
    path = path.replace(key, ':key');
  }

  return path;
};

module.exports = {
  getClientIp,
  getSanitizedPath,
};
