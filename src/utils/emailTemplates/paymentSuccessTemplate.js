export const paymentSuccessTemplate = (user) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Congratulations ${user.name}! 🎉</h2>
    <p>Your payment was successful and your account is now <strong style="color:green;">active</strong>.</p>

    <h3>Account Details</h3>
    <ul>
      <li><strong>Email:</strong> ${user.email}</li>
      <li><strong>Phone:</strong> ${user.phone}</li>
      <li><strong>Plan:</strong> ${user.plan?.name || "N/A"}</li>
    </ul>

    <p>You can now log in and start using all the features of your account.</p>

    <p style="margin-top:20px;">Thank you for trusting us, <br/> The Team</p>
  </div>
`;
