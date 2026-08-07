require("dotenv").config();
const logo = process.env.LOGO_URL;
const email = process.env.SUPPORT_EMAIL;

const inviteUser = (signupLink, userName, invitedBy ,ProjectName) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Invitation to Join Be Balanced</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F7F4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F7F4ED; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.07);">

            <!-- Logo -->
             <tr>
              <td align="center" style="padding-bottom: 30px;">
 <img 
      src="cid:logo" 
      alt="Be Balanced Logo" 
      width="110" 
      height="110" 
      style="display: block; max-width: 100%; border: 0; outline: none; text-decoration: none;"
    />              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="font-size: 20px; color: #4A595A; text-align: center; padding-bottom: 16px;">
                Hello ${userName},
              </td>
            </tr>

            <!-- Invitation Message -->
            <tr>
              <td style="font-size: 16px; color: #333333; text-align: center; line-height: 1.6; padding-bottom: 20px;">
                You've been invited to join the <strong>${ProjectName}</strong>,
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td align="center" style="padding: 30px 0;">
                <a href="${signupLink}" style="background-color: #4A595A; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Create Your Account
                </a>
              </td>
            </tr>

            <!-- Additional Info -->
            <tr>
              <td style="font-size: 14px; color: #555555; text-align: center; line-height: 1.6;">
                Click the button above to complete your registration and get started.
                <br /><br />
                If you did not request this invitation, please contact our support team immediately at 
                <a href="mailto:${email}" style="color: #4A595A; text-decoration: none;">${email}</a>.
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="font-size: 14px; color: #888888; text-align: center; padding-top: 40px;">
                — The Ccript Team
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

module.exports = inviteUser;
