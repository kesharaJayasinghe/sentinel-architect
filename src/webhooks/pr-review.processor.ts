import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { OctokitService } from "src/github/octokit.service";
import { GoogleGenAI } from "@google/genai";


@Processor('pr-review-queue')
export class PrReviewProcessor extends WorkerHost {
    private ai: GoogleGenAI;

    constructor(private readonly octokitService: OctokitService) {
        super();

        // Initialize Google Gemini AI client
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
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

        // Call Google Gemini AI
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: `Review this PR diff:\n${diff}` }] }],
            config: {
                systemInstruction: 'You are "Sentinel Architect," a Senior Software Architect. Provide deep architectural and security analysis of the provided git diff.',
                temperature: 0.2,
            },
        });

        const reviewFeedback = response.text;

        // Post the comment back to the Pull Request
        await octokit.rest.issues.createComment({
            owner,
            repo: repoName,
            issue_number: prNumber,
            body: `### 🛡️ Sentinel Architect Review\n\n${reviewFeedback}`,
        });

        return { status: 'success' };
    }
}