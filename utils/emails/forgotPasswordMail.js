const resend = require("../../config/resend");

async function sendForgotPasswordMail({
  email,
  firstName,
  token,
}) {
  try {
    console.log("Sending forgot password email to:", email);

    const resetUrl =
      `https://nurasms.com/reset-password/${token}`;

    const response = await resend.emails.send({
      from: "Nura SMS <no-reply@blisscourtapartments.com>",
      to: [email],
      subject: "Reset Your Nura SMS Password",
      html: `
        <div style="background-color:#f5f3ff;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">

          <table
            align="center"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width:600px;
              background:#ffffff;
              border-radius:8px;
              overflow:hidden;
            "
          >

            <tr>
              <td
                style="
                  padding:30px;
                  text-align:center;
                  background:#6d28d9;
                  color:#ffffff;
                "
              >
                <h1
                  style="
                    margin:0;
                    font-size:24px;
                  "
                >
                  Nura SMS
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 30px;">

                <h2
                  style="
                    margin-top:0;
                    color:#4c1d95;
                  "
                >
                  Reset Your Password
                </h2>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Hello ${firstName || "there"},
                </p>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  We received a request to reset the password
                  for your Nura SMS account.
                </p>

                <p
                  style="
                    color:#4b5563;
                    font-size:15px;
                    line-height:1.6;
                  "
                >
                  Click the button below to create a new password.
                </p>

                <div
                  style="
                    margin:30px 0;
                    text-align:center;
                  "
                >
                  <a
                    href="${resetUrl}"
                    style="
                      display:inline-block;
                      background:#6d28d9;
                      color:#ffffff;
                      text-decoration:none;
                      padding:14px 28px;
                      border-radius:8px;
                      font-size:15px;
                      font-weight:600;
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <p
                  style="
                    color:#6b7280;
                    font-size:13px;
                    line-height:1.6;
                  "
                >
                  This password reset link will expire in 1 hour.
                </p>

                <p
                  style="
                    color:#6b7280;
                    font-size:13px;
                    line-height:1.6;
                  "
                >
                  If you did not request a password reset,
                  you can safely ignore this email. Your password
                  will remain unchanged.
                </p>

                <p
                  style="
                    margin-top:30px;
                    color:#9ca3af;
                    font-size:12px;
                    line-height:1.5;
                    word-break:break-all;
                  "
                >
                  If the button doesn't work, copy and paste this
                  link into your browser:
                  <br />
                  ${resetUrl}
                </p>

              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:20px 30px;
                  text-align:center;
                  font-size:12px;
                  color:#9ca3af;
                  border-top:1px solid #e5e7eb;
                "
              >
                © ${new Date().getFullYear()}
                Nura SMS. All rights reserved.
              </td>
            </tr>

          </table>

        </div>
      `,
    });

    console.log("RESEND RESPONSE:", response);

    return response;
  } catch (error) {
    console.error("RESEND ERROR:", error);

    throw error;
  }
}

module.exports = sendForgotPasswordMail;