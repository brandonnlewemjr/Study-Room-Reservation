const buckets = new Map();

function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 20;

  return function limitRequests(req, res, next) {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();

    const bucket = buckets.get(key) || {
      count: 0,
      resetAt: now + windowMs
    };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

function resetRateLimiter() {
  buckets.clear();
}

module.exports = {
  rateLimiter,
  resetRateLimiter
};
