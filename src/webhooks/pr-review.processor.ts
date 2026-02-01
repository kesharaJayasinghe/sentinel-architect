import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { OctokitService } from "src/github/octokit.service";


@Processor('pr-review-queue')
export class PrReviewProcessor extends WorkerHost {
    constructor(private readonly octokitService: OctokitService) {
        super();
    }

    async process(job: Job): Promise<any> {
        const { repo, prNumber, installationId } = job.data;
        const octokit = await this.octokitService.getInstallationClient(installationId);

        const [owner, repoName] = repo.split('/');

        // Fetch the PR Diff
        const { data: diff } = await octokit.rest.pulls.get({
            owner,
            repo: repoName,
            pull_number: prNumber,
            mediaType: {
                format: 'diff',
            },
        }) as unknown as { data: string };

        console.log(`Successfully fetched PR diff. Length: ${diff.length} characters.`);

        return { status: 'completed' };
    }
}