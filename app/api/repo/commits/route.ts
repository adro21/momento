import { NextResponse } from "next/server";
import { GitOperations } from "@/lib/git";
import { DEFAULT_TARGET_FRAMES } from "@/lib/constants";

export async function POST(request: Request) {
  const { repoPath, branch } = await request.json();

  const git = new GitOperations(repoPath);
  const commits = await git.listCommits(branch);

  const suggestedN = Math.max(1, Math.floor(commits.length / DEFAULT_TARGET_FRAMES));

  return NextResponse.json({
    total: commits.length,
    suggestedN,
    commits: commits.slice(0, 200), // limit for preview
  });
}
