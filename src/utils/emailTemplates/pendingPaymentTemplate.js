export const pendingPaymentTemplate = (user, checkoutUrl) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Welcome ${user.name},</h2>
    <p>Thank you for signing up! To activate your account, please complete your payment.</p>
    
    <p><strong>Plan:</strong> ${user.planId.name}</p>
    <p><strong>Price:</strong> $${(user.planId.price / 100).toFixed(2)}</p>

    <p style="margin-top:20px;">
      <a href="${checkoutUrl}" style="display:inline-block;padding:12px 20px;background:#4CAF50;color:white;text-decoration:none;border-radius:5px;">
        Complete Payment
      </a>
    </p>

    <p>If the button doesn’t work, copy this link:</p>
    <p>${checkoutUrl}</p>

    <p>Thank you, <br/> The Team</p>
  </div>
`;
