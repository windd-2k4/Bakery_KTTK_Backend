import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async handleChat(@Body('message') message: string) {
    if (!message) {
      return { reply: 'Bạn muốn hỏi gì nhỉ?' };
    }
    return this.chatService.generateResponse(message);
  }
}
