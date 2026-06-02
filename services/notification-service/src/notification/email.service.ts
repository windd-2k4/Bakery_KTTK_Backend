import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export interface OrderConfirmationEmailPayload {
  email: string;
  orderId: string;
  customerName?: string;
  totalAmount: number;
  paymentMethod: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') ?? 'smtp.gmail.com',
      port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendAdminOTP(email: string, otp: string): Promise<void> {
    const transporter = this.createTransporter();
    const from = this.configService.get<string>('MAIL_FROM') ?? '"SweetBakery Security" <no-reply@sweetbakery.local>';

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Mã OTP đăng nhập hệ thống quản trị SweetBakery',
        html: this.buildOtpEmailTemplate(otp),
      });

      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send OTP email', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async sendOrderConfirmation(payload: OrderConfirmationEmailPayload): Promise<void> {
    const transporter = this.createTransporter();
    const from = this.configService.get<string>('MAIL_FROM') ?? '"SweetBakery Orders" <no-reply@sweetbakery.local>';
    const customerName = payload.customerName?.trim() || 'Quý khách';

    try {
      await transporter.sendMail({
        from,
        to: payload.email,
        subject: `Xác nhận đơn hàng #${payload.orderId} từ SweetBakery`,
        html: this.buildOrderConfirmationTemplate({
          ...payload,
          customerName,
        }),
      });

      this.logger.log(`Order confirmation email sent to ${payload.email} for order ${payload.orderId}`);
    } catch (error) {
      this.logger.error('Failed to send order confirmation email', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private buildOtpEmailTemplate(otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:24px; color:#1f2937;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          <div style="padding:24px 28px; background:#111827; color:#ffffff;">
            <h2 style="margin:0; font-size:20px;">SweetBakery Security</h2>
          </div>
          <div style="padding:28px; line-height:1.6;">
            <p style="margin:0 0 16px; font-size:16px;">Xin chào,</p>
            <p style="margin:0 0 16px; font-size:16px;">
              Mã OTP đăng nhập hệ thống quản trị SweetBakery của bạn là:
            </p>
            <div style="margin:24px 0; text-align:center;">
              <span style="display:inline-block; padding:16px 28px; border:1px solid #d1d5db; border-radius:12px; font-size:28px; font-weight:700; letter-spacing:6px; background:#f9fafb;">
                ${otp}
              </span>
            </div>
            <p style="margin:0 0 12px; font-size:14px; color:#4b5563;">
              Mã này có hiệu lực trong 5 phút.
            </p>
            <p style="margin:0; font-size:14px; color:#4b5563;">
              Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private buildOrderConfirmationTemplate(payload: OrderConfirmationEmailPayload & { customerName: string }): string {
    return `
      <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:24px; color:#1f2937;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          <div style="padding:24px 28px; background:#111827; color:#ffffff;">
            <h2 style="margin:0; font-size:20px;">SweetBakery Order Confirmation</h2>
          </div>
          <div style="padding:28px; line-height:1.7;">
            <p style="margin:0 0 12px; font-size:16px;">Xin chào ${payload.customerName},</p>
            <p style="margin:0 0 16px; font-size:15px; color:#374151;">
              Đơn hàng <strong>#${payload.orderId}</strong> của bạn đã được ghi nhận thành công.
            </p>
            <div style="padding:16px 18px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; margin:20px 0;">
              <p style="margin:0 0 8px;"><strong>Tổng tiền:</strong> ${payload.totalAmount.toLocaleString('vi-VN')} VND</p>
              <p style="margin:0 0 8px;"><strong>Phương thức thanh toán:</strong> ${payload.paymentMethod}</p>
              <p style="margin:0;"><strong>Mã đơn hàng:</strong> ${payload.orderId}</p>
            </div>
            <p style="margin:0; font-size:14px; color:#4b5563;">
              Chúng tôi sẽ tiếp tục xử lý đơn hàng và cập nhật trạng thái sớm nhất có thể.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
