const buildSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

const enforceHttps = (req, res, next) => {
  const shouldForce = process.env.FORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
  const proto = req.headers['x-forwarded-proto'];

  if (!shouldForce) {
    return next();
  }

  if (req.secure || proto === 'https') {
    return next();
  }

  const host = req.headers.host;
  return res.redirect(301, `https://${host}${req.originalUrl}`);
};

module.exports = { buildSecurityHeaders, enforceHttps };
