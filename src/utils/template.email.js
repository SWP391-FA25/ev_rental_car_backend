const generateEmailTemplate = (token, purpose) => {
  const config = getEmailConfig(purpose);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - EV Rental</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #A8B8C8 0%, #B8C5D3 100%); line-height: 1.6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 60px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);">

                    <tr>
                        <td style="padding: 0; background: linear-gradient(135deg, #8B9DAF 0%, #A8B8C8 100%);">
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td style="padding: 48px 48px 56px; text-align: center;">
                                        <h2 style="margin: 0 0 24px; font-family: 'Brush Script MT', cursive, 'Segoe Script', 'Comic Sans MS'; font-size: 42px; font-weight: 400; color: #ffffff; font-style: italic; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Ev Rental</h2>
                                        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">${config.heading}</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 56px 48px 48px;">
                            <p style="margin: 0 0 28px; font-size: 17px; color: #374151; line-height: 1.7;">
                                ${config.greeting}
                            </p>

                            <p style="margin: 0 0 32px; font-size: 16px; color: #4b5563; line-height: 1.7;">
                                ${config.message}
                            </p>

                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 40px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${config.actionUrl(token)}"
                                           style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #8B9DAF 0%, #7A8FA3 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 17px; letter-spacing: 0.02em; box-shadow: 0 6px 20px rgba(139, 157, 175, 0.35); transition: all 0.3s ease;">
                                            ${config.buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin: 40px 0 0; padding: 24px; background-color: #F3F6F9; border-radius: 10px; border-left: 4px solid #8B9DAF;">
                                <p style="margin: 0 0 12px; font-size: 14px; color: #4b5563; font-weight: 600;">
                                    Nút không hoạt động?
                                </p>
                                <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                    Sao chép và dán liên kết này vào trình duyệt của bạn:
                                </p>
                                <p style="margin: 0; font-size: 13px; color: #8B9DAF; word-break: break-all; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px;">
                                    ${config.actionUrl(token)}
                                </p>
                            </div>

                            <div style="margin: 32px 0 0; padding: 20px; background-color: ${config.warningBgColor}; border-radius: 10px; border-left: 4px solid ${config.warningBorderColor};">
                                <p style="margin: 0; font-size: 14px; color: ${config.warningTextColor}; line-height: 1.6;">
                                    <strong>${config.warningIcon} ${config.warningTitle}</strong> ${config.warningMessage}
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 48px; background: linear-gradient(135deg, #F3F6F9 0%, #E8EDF2 100%); border-top: 1px solid #D1D5DB;">
                            <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563; text-align: center; line-height: 1.6;">
                                Cần hỗ trợ? Liên hệ đội ngũ của chúng tôi tại<br>
                                <a href="mailto:support@evrental.com" style="color: #8B9DAF; text-decoration: none; font-weight: 600;">support@evrental.com</a>
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #9CA3AF; text-align: center;">
                                © 2025 EV Rental - Cùng Bạn Trên Mọi Hành Trình
                            </p>
                        </td>
                    </tr>

                </table>

                <table role="presentation" style="max-width: 600px; width: 100%; margin-top: 32px;">
                    <tr>
                        <td style="text-align: center; padding: 0 20px;">
                            <p style="margin: 0; font-size: 13px; color: #ffffff; line-height: 1.6; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
                                ${config.footerText}
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`;
};

/**
 * Get email configuration based on purpose
 * @param {string} purpose - Email purpose type
 * @returns {object} Configuration object
 */
const getEmailConfig = (purpose) => {
  const configs = {
    'verify-email': {
      title: 'Xác Thực Email',
      heading: 'Xác Thực Địa Chỉ Email',
      greeting:
        'Chào mừng bạn đến với <strong>EV Rental</strong>! Chúng tôi rất vui mừng được đồng hành cùng bạn trên mọi hành trình.',
      message:
        'Để hoàn tất đăng ký và bắt đầu trải nghiệm dịch vụ thuê xe điện của chúng tôi, vui lòng xác thực địa chỉ email bằng cách nhấp vào nút bên dưới.',
      buttonText: 'Xác Thực Email Ngay',
      actionUrl: (token) =>
        `${process.env.BASE_URL || 'http://localhost:5000'}/api/email/verify/${token}`,
      warningIcon: '🔒',
      warningTitle: 'Thông Báo Bảo Mật:',
      warningMessage:
        'Liên kết xác thực này sẽ hết hạn sau 24 giờ. Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.',
      warningBgColor: '#FEF3C7',
      warningBorderColor: '#F59E0B',
      warningTextColor: '#92400E',
      footerText:
        'Email này được gửi đến bạn vì bạn đã đăng ký tài khoản EV Rental.<br>Nếu bạn không yêu cầu email này, bạn có thể bỏ qua nó một cách an toàn.',
    },
    'reset-password': {
      title: 'Đặt Lại Mật Khẩu',
      heading: 'Đặt Lại Mật Khẩu',
      greeting:
        'Xin chào! Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>EV Rental</strong> của bạn.',
      message:
        'Để đặt lại mật khẩu của bạn, vui lòng nhấp vào nút bên dưới. Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.',
      buttonText: 'Đặt Lại Mật Khẩu',
      actionUrl: (token) =>
        `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/reset-password/${token}`,
      warningIcon: '⚠️',
      warningTitle: 'Quan Trọng:',
      warningMessage:
        'Liên kết này chỉ có hiệu lực trong 1 giờ vì lý do bảo mật. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.',
      warningBgColor: '#FEE2E2',
      warningBorderColor: '#EF4444',
      warningTextColor: '#991B1B',
      footerText:
        'Email này được gửi đến bạn vì có yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br>Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay lập tức.',
    },
  };

  if (!configs[purpose]) {
    throw new Error(
      `Invalid email purpose: ${purpose}. Valid options are: ${Object.keys(configs).join(', ')}`
    );
  }

  return configs[purpose];
};

export { generateEmailTemplate, getEmailConfig };
