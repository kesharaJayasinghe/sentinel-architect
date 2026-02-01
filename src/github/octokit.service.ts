import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Octokit } from '@octokit/core';
import { createAppAuth } from '@octokit/auth-app';
import * as fs from 'fs';

@Injectable()
export class OctokitService {
    private appOctokit: Octokit;

    constructor() {
        const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH!, 'utf8');

        this.appOctokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: process.env.GITHUB_APP_ID!,
                privateKey: privateKey,
            },
        });
    }

    async getInstallationOctokit(installationId: number): Promise<Octokit> {
        const auth = createAppAuth({
            appId: Number(process.env.GITHUB_APP_ID!),
            privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH!, 'utf8'),
        });

        const { token } = await auth ({
            type: 'installation',
            installationId: installationId,
        });

        return new Octokit({ auth: token});
    }
}