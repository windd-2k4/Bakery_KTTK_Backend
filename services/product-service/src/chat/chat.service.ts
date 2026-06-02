import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly configService: ConfigService,
  ) {}

  private async getMenuFromDatabase(): Promise<string> {
    const pastries = await this.productRepository.find({ take: 30 });
    if (pastries.length === 0) return 'Menu đang cập nhật.';

    return pastries
      .map(p => `ID: ${p.id} | Tên: ${p.name} | Giá: ${p.price} VND | Mô tả: ${p.description}`)
      .join('\n');
  }

  async generateResponse(userMessage: string): Promise<{ reply: string }> {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      const apiUrl = this.configService.get<string>('GEMINI_URL') || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        return { reply: 'Lỗi cấu hình Server: Chưa có API Key.' };
      }

      const finalUrl = `${apiUrl}?key=${apiKey}`;
      const menuData = await this.getMenuFromDatabase();

      const systemPrompt = `Bạn là nhân viên tư vấn của Sweet Bakery.
MENU HIỆN TẠI:
${menuData}
--------------------
YÊU CẦU:
1. Nếu khách hỏi về bánh, hãy gợi ý dựa trên menu trên.
2. Khi nhắc tên bánh, PHẢI dùng định dạng: [Tên Bánh](ID) (Ví dụ: [Bánh Tiramisu](101)).
3. Trả lời ngắn gọn (dưới 100 từ), thân thiện, dùng emoji.

Khách hàng: "${userMessage}"`;

      const body = {
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
      };

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const text = await response.text();
          this.logger.error('=== GEMINI 429 BODY ===\n' + text);
          return { reply: 'Bot đang quá tải do nhiều người dùng. Bạn vui lòng đợi một lúc rồi hỏi lại giúp mình nhé! ☕' };
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) {
        return { reply: replyText };
      }

      return { reply: 'Xin lỗi, mình chưa hiểu ý bạn.' };
    } catch (error) {
      this.logger.error('Error generating AI response', error);
      return { reply: 'Hệ thống đang bận chút xíu. Vui lòng thử lại sau.' };
    }
  }
}
