import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhooksController } from './webhooks/webhooks.controller';

@Module({
  imports: [],
  controllers: [AppController, WebhooksController],
  providers: [AppService],
})
export class AppModule {}
