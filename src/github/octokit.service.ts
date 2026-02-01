import { Injectable } from '@nestjs/common';
import { Octokit } from 'octokit';
import * as fs from 'fs';

@Injectable()
export class OctokitService {

    async getInstallationClient(installationId: number): Promise<Octokit> {
        const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH!, 'utf8');

        return new Octokit({
            authStrategy: null, // use explicit app-auth logic
            auth: {
                appId: process.env.GITHUB_APP_ID,
                privateKey: privateKey,
                installationId: installationId,
            },
        });
    }
}