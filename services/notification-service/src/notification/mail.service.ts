import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendOrderNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    try {
      // In a real implementation, you would fetch user email from database
      // For now, we'll use a placeholder email based on userId
      const userEmail = `user-${payload.userId}@example.com`;

      await this.mailerService.sendMail({
        to: userEmail,
        subject: payload.title,
        html: `
          <h2>${payload.title}</h2>
          <p>${payload.body}</p>
          ${payload.data ? `<p>Chi tiết: ${JSON.stringify(payload.data, null, 2)}</p>` : ''}
          <hr>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        `,
      });

      this.logger.log(`Email sent to ${userEmail} for notification type ${payload.type}`);
    } catch (error) {
      this.logger.error('Failed to send email notification', error);
    }
  }

  async sendPaymentNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    try {
      const userEmail = `user-${payload.userId}@example.com`;

      const emailType = payload.type === 'PAYMENT_SUCCESS' ? 'Thanh toán' : 'Hoàn tiền';

      await this.mailerService.sendMail({
        to: userEmail,
        subject: `[${emailType}] ${payload.title}`,
        html: `
          <h2>${payload.title}</h2>
          <p>${payload.body}</p>
          ${
            payload.data
              ? `
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>Mã giao dịch:</strong> ${payload.data.paymentId || 'N/A'}</p>
              <p><strong>Mã đơn hàng:</strong> ${payload.data.orderId || 'N/A'}</p>
              <p><strong>Số tiền:</strong> ${(payload.data.amount || 0).toLocaleString('vi-VN')}đ</p>
              <p><strong>Phương thức:</strong> ${payload.data.method || 'N/A'}</p>
            </div>
          `
              : ''
          }
          <hr>
          <p>Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.</p>
        `,
      });

      this.logger.log(`Payment email sent to ${userEmail} for notification type ${payload.type}`);
    } catch (error) {
      this.logger.error('Failed to send payment email notification', error);
    }
  }
}
