import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TelegramService],
})
export class TelegramModule {}
