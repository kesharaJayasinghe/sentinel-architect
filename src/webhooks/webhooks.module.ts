import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';

@Module({
    imports: [
        // Register the queue specifically for this module
        BullModule.registerQueue({
            name: 'pr-review-queue',
        }),
    ],
    controllers: [WebhooksController],
    providers: []
})
export class WebhooksModule {}
