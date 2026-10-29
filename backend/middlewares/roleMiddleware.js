/**
 * Role-Based Access Control Middleware
 * Usage: router.get('/path', verifyToken, authorizeRoles('ADMIN', 'ACCOUNTANT'), handler)
 */

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - User not authenticated' });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Forbidden - Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole
      });
    }

    next();
  };
};
