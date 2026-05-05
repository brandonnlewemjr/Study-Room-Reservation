function attachUser(req, res, next) {
  const role = req.header('x-role') || 'student';
  const id = req.header('x-user-id') || 'anonymous';

  req.user = {
    id,
    role
  };

  next();
}

function requireStaff(req, res, next) {
  if (!['staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'PERMISSION_DENIED',
      message: 'This action requires staff access.'
    });
  }

  next();
}

module.exports = {
  attachUser,
  requireStaff
};
