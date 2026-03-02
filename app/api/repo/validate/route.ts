import { NextResponse } from "next/server";
import { GitOperations } from "@/lib/git";

export async function POST(request: Request) {
  const { repoPath } = await request.json();

  const git = new GitOperations(repoPath);
  const valid = await git.isValidRepo();

  if (!valid) {
    return NextResponse.json(
      { valid: false, error: "Not a valid git repository" },
      { status: 400 }
    );
  }

  const repoName = await git.getRepoName();
  const branches = await git.listBranches();

  return NextResponse.json({
    valid: true,
    repoName,
    branches,
  });
}
