import jwt from 'jsonwebtoken';

// Short-lived, renew-only token: lets an expired student reach /payment/subscripe and
// /auth/logout. userActiveMiddleware rejects it for every other student route.
export const generateRenewToken = (user) =>
  jwt.sign({ userId: user._id, email: user.email, scope: "renew" }, process.env.JWT_SECRET, { expiresIn: "30m" });

export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, status:user.status },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
