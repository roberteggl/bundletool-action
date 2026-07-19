import type { BundletoolSource } from '../config/types.js'
import { DownloadError } from '../errors.js'
import type { Logger } from '../logging/logger.js'

const GITHUB_API = 'https://api.github.com'
const REPO = 'google/bundletool'

export interface BundletoolRelease {
  version: string
  downloadUrl: string
  assetName: string
}

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  assets: GitHubAsset[]
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bundletool-action',
    'X-GitHub-Api-Version': '2022-11-28'
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function normalizeVersion(tagName: string): string {
  return tagName.replace(/^v/, '')
}

function pickJarAsset(assets: GitHubAsset[]): GitHubAsset {
  const preferred = assets.find((asset) =>
    /^bundletool-all-.*\.jar$/i.test(asset.name)
  )
  if (preferred) {
    return preferred
  }

  const anyJar = assets.find((asset) => /\.jar$/i.test(asset.name))
  if (anyJar) {
    return anyJar
  }

  throw new DownloadError(
    'No .jar asset found on the google/bundletool release.'
  )
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { headers: authHeaders() })
  } catch (error) {
    throw new DownloadError(
      `Failed to reach GitHub Releases API (${url}): ${error instanceof Error ? error.message : String(error)}`
    )
  }

  if (response.status === 404) {
    throw new DownloadError(`Bundletool release not found: ${url}`)
  }

  if (!response.ok) {
    throw new DownloadError(
      `Unexpected GitHub API response from ${url}: ${response.status} ${response.statusText}`
    )
  }

  return (await response.json()) as T
}

async function resolveFromGitHub(version: string): Promise<BundletoolRelease> {
  const endpoint =
    version === 'latest'
      ? `${GITHUB_API}/repos/${REPO}/releases/latest`
      : `${GITHUB_API}/repos/${REPO}/releases/tags/${normalizeVersion(version)}`

  const release = await fetchJson<GitHubRelease>(endpoint)
  const asset = pickJarAsset(release.assets)

  return {
    version: normalizeVersion(release.tag_name),
    downloadUrl: asset.browser_download_url,
    assetName: asset.name
  }
}

/**
 * Resolve the concrete bundletool version and download URL.
 */
export async function resolveRelease(
  source: BundletoolSource,
  logger: Logger
): Promise<BundletoolRelease> {
  if (source.url) {
    const version =
      source.version === 'latest' ? 'custom' : normalizeVersion(source.version)

    logger.info(`Using override bundletool URL for version ${version}`)
    return {
      version,
      downloadUrl: source.url,
      assetName: 'bundletool.jar'
    }
  }

  logger.verbose(`Resolving google/bundletool release: ${source.version}`)
  const release = await resolveFromGitHub(source.version)
  logger.info(`Resolved bundletool ${release.version} (${release.assetName})`)
  return release
}
