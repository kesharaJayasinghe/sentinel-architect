import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    // Global connection to Redis
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    // Register the specific queue for PR reviews
    BullModule.registerQueue({
      name: 'pr-review-queue',
    }),
    WebhooksModule,
  ],
})
export class AppModule {}
