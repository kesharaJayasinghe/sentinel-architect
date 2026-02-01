import { Controller, Post, Headers, Req, Res, ForbiddenException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhooksController {

    @Post()
    async handleWebhook(
        @Headers('x-hub-signature-256') signature: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response
    ) {
        // Verify the signature
        if (!this.verifySignature(signature, req.rawBody)) {
            throw new ForbiddenException('Invalid signature');
        }

        const event = req.headers['x-github-event'];

        // Filter for pull request events
        if (event === 'pull_request') {
            const { action, pull_request } = req.body;

            if (action === 'opened' || action === 'synchronize') {
                console.log(`PR Detected: ${pull_request.title} by ${pull_request.user.login}`);

                // TODO: Push this to a Queue (SQS/PubSub) 
                // to handle the long-running AI analysis asynchronously
            }
        }

        // Always respond quickly to GitHub
        return res.status(202).send('Accepted');
    }

    private verifySignature(signature: string, payload: any): boolean {
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (!secret) {
            throw new Error('GITHUB_WEBHOOK_SECRET is not configured');
        }
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    }
}
