
/**
 * Utility for fetching Solidity files from a public GitHub repository.
 * Supports links of the form: 
 *   https://github.com/user/repo
 *   https://github.com/user/repo/
 *   https://github.com/user/repo/tree/branch
 *
 * For simplicity, only fetch up to 10 `.sol` files (including in subfolders).
 */
export type RepoSolidityFile = {
  path: string;
  raw_url: string;
  content?: string; // Only present after fetching actual raw content
};

// Regexp to match and extract username, repo, branch (optional)
const GITHUB_REPO_REGEX =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/;

/**
 * Fetches the list of Solidity files (.sol) in a GitHub repo (recursively).
 */
export async function fetchSolidityFilesFromGithubRepo(
  repoUrl: string,
  maxFiles: number = 10
): Promise<RepoSolidityFile[]> {
  const m = repoUrl.match(GITHUB_REPO_REGEX);
  if (!m) throw new Error("Unsupported or invalid GitHub repo URL");
  const [_, owner, repo, branch] = m;
  let effectiveBranch = branch;
  // 1. Find default branch if branch not set
  if (!effectiveBranch) {
    const repoMeta = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`
    ).then((r) => r.json());
    if (repoMeta.default_branch) {
      effectiveBranch = repoMeta.default_branch;
    } else {
      throw new Error("Couldn't resolve repo branch");
    }
  }

  // 2. Recursively walk the repo tree and find all `.sol` files
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${effectiveBranch}?recursive=1`
  );
  if (!treeRes.ok) throw new Error("Could not fetch repo file tree");
  const treeData = await treeRes.json();
  if (!treeData.tree) throw new Error("Empty repo tree");
  // Find .sol files
  const solFiles = (treeData.tree as any[])
    .filter(
      (f) =>
        f.type === "blob" &&
        typeof f.path === "string" &&
        f.path.endsWith(".sol")
    )
    .slice(0, maxFiles)
    .map((f) => ({
      path: f.path,
      // Use raw.githubusercontent to get raw content
      raw_url: `https://raw.githubusercontent.com/${owner}/${repo}/${effectiveBranch}/${f.path}`,
    }));

  return solFiles;
}

/**
 * Given a RepoSolidityFile list, fetches their raw content.
 */
export async function fetchFileContents(
  files: RepoSolidityFile[]
): Promise<RepoSolidityFile[]> {
  return Promise.all(
    files.map(async (f) => {
      const content = await fetch(f.raw_url).then((res) =>
        res.ok ? res.text() : ""
      );
      return { ...f, content };
    })
  );
}
