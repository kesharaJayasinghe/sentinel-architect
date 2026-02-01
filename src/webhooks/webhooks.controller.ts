import { Controller, Post, Headers, Req, Res, ForbiddenException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq/dist/esm/classes/queue';

@Controller('webhooks')
export class WebhooksController {
    constructor(@InjectQueue('pr-review-queue') private readonly prQueue: Queue) {}

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
            const { action, pull_request, installation } = req.body;

            if (action === 'opened' || action === 'synchronize') {
                console.log(`PR Detected: ${pull_request.title} by ${pull_request.user.login}`);

                // Add a job to the queue
                await this.prQueue.add('analyze-pr', {
                    repo: pull_request.base.repo.full_name,
                    prNumber: pull_request.number,
                    installationId: installation.id,
                    diffUrl: pull_request.diff_url,  
                }, {
                    attempts: 3, // Retry up to 3 times if AI rate limited
                    backoff: { type: 'exponential', delay: 1000 },
                });
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
