[CmdletBinding()]
param(
    [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$parentRoot = Split-Path -Parent $projectRoot
$deployRoot = Join-Path $parentRoot 'needsolar-deploy'
$previousRoot = Join-Path $parentRoot 'needsolar-deploy.previous'
$stagingRoot = Join-Path $parentRoot ("needsolar-deploy.staging-{0}" -f [guid]::NewGuid().ToString('N'))

function Assert-SafeSiblingPath {
    param(
        [Parameter(Mandatory)]
        [string]$Path,
        [Parameter(Mandatory)]
        [string]$ExpectedLeafPattern
    )

    $full = [IO.Path]::GetFullPath($Path)
    $fullParent = Split-Path -Parent $full
    $leaf = Split-Path -Leaf $full

    if ($fullParent -ne $parentRoot -or $leaf -notmatch $ExpectedLeafPattern) {
        throw "Unsafe deployment path: $full"
    }

    return $full
}

function Get-PublicSourceFiles {
    $files = [Collections.Generic.List[IO.FileInfo]]::new()

    Get-ChildItem -LiteralPath $projectRoot -File |
        Where-Object { $_.Extension -in '.html', '.json' } |
        ForEach-Object { $files.Add($_) }

    foreach ($directory in 'css', 'js', 'assets') {
        $path = Join-Path $projectRoot $directory
        if (-not (Test-Path -LiteralPath $path -PathType Container)) {
            throw "Required public directory is missing: $directory"
        }

        Get-ChildItem -LiteralPath $path -Recurse -File |
            ForEach-Object { $files.Add($_) }
    }

    return $files
}

function Get-RelativePath {
    param(
        [Parameter(Mandatory)]
        [string]$FullName,
        [Parameter(Mandatory)]
        [string]$BasePath
    )

    return [IO.Path]::GetRelativePath($BasePath, $FullName)
}

function Test-PublicSourceSafety {
    param(
        [Parameter(Mandatory)]
        [IO.FileInfo[]]$Files
    )

    $textExtensions = '.html', '.json', '.css', '.js'
    $graphApiFiles = [Collections.Generic.List[string]]::new()
    $explicitTokenFiles = [Collections.Generic.List[string]]::new()
    $tokenValueFiles = [Collections.Generic.List[string]]::new()
    $localProjectFeedFiles = [Collections.Generic.List[string]]::new()

    foreach ($file in $Files) {
        if ($file.Extension -notin $textExtensions) {
            continue
        }

        $content = [IO.File]::ReadAllText($file.FullName)
        $relative = Get-RelativePath -FullName $file.FullName -BasePath $projectRoot

        if ($content -match '(?i)graph\.facebook\.com') {
            $graphApiFiles.Add($relative)
        }
        if ($content -match '(?i)access_token\s*[=:]') {
            $explicitTokenFiles.Add($relative)
        }
        if ($content -match '(?i)EAA[A-Za-z0-9]{40,}') {
            $tokenValueFiles.Add($relative)
        }
        if ($content -match 'PROJ_DATA|assets/images/projects/thumb-\d{3}|ทั้งหมด\s*\(43\)') {
            $localProjectFeedFiles.Add($relative)
        }
    }

    if ($graphApiFiles.Count -gt 0 -or
        $explicitTokenFiles.Count -gt 0 -or
        $tokenValueFiles.Count -gt 0 -or
        $localProjectFeedFiles.Count -gt 0) {
        $unsafeFiles = @(
            $graphApiFiles
            $explicitTokenFiles
            $tokenValueFiles
            $localProjectFeedFiles
        ) |
            Sort-Object -Unique
        throw "Unsafe Facebook credential or local project-feed code found in: $($unsafeFiles -join ', ')"
    }
}

function Test-ImageReferences {
    param(
        [Parameter(Mandatory)]
        [string]$Root
    )

    $textFiles = Get-ChildItem -LiteralPath $Root -Recurse -File |
        Where-Object { $_.Extension -in '.html', '.json', '.css', '.js' }
    $references = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $pattern = 'assets/images/[A-Za-z0-9_./%()\-]+\.(?:png|jpe?g|webp|gif|svg|avif|ico)'

    foreach ($file in $textFiles) {
        $content = [IO.File]::ReadAllText($file.FullName)
        foreach ($match in [regex]::Matches($content, $pattern, 'IgnoreCase')) {
            [void]$references.Add([uri]::UnescapeDataString($match.Value))
        }
    }

    $missing = [Collections.Generic.List[string]]::new()
    foreach ($reference in $references) {
        $full = Join-Path $Root ($reference.Replace('/', [IO.Path]::DirectorySeparatorChar))
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
            $missing.Add($reference)
        }
    }

    if ($missing.Count -gt 0) {
        throw "Missing public image references: $($missing -join ', ')"
    }

    return $references.Count
}

function Copy-PublicFiles {
    param(
        [Parameter(Mandatory)]
        [IO.FileInfo[]]$Files
    )

    New-Item -ItemType Directory -Path $stagingRoot | Out-Null

    foreach ($file in $Files) {
        $relative = Get-RelativePath -FullName $file.FullName -BasePath $projectRoot
        $destination = Join-Path $stagingRoot $relative
        $destinationParent = Split-Path -Parent $destination

        if (-not (Test-Path -LiteralPath $destinationParent -PathType Container)) {
            New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
        }

        Copy-Item -LiteralPath $file.FullName -Destination $destination
    }
}

function Test-StagingMatchesSource {
    param(
        [Parameter(Mandatory)]
        [IO.FileInfo[]]$Files
    )

    $stagedFiles = @(Get-ChildItem -LiteralPath $stagingRoot -Recurse -File)
    if ($stagedFiles.Count -ne $Files.Count) {
        throw "Deploy file count mismatch: expected $($Files.Count), found $($stagedFiles.Count)"
    }

    foreach ($file in $Files) {
        $relative = Get-RelativePath -FullName $file.FullName -BasePath $projectRoot
        $stagedPath = Join-Path $stagingRoot $relative

        if (-not (Test-Path -LiteralPath $stagedPath -PathType Leaf)) {
            throw "Deploy file is missing: $relative"
        }

        $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
        $stagedHash = (Get-FileHash -LiteralPath $stagedPath -Algorithm SHA256).Hash
        if ($sourceHash -ne $stagedHash) {
            throw "Deploy hash mismatch: $relative"
        }
    }

    foreach ($blockedDirectory in '.git', 'admin', 'source-assets', '.claude', '.code-review-graph') {
        if (Test-Path -LiteralPath (Join-Path $stagingRoot $blockedDirectory)) {
            throw "Blocked development directory entered deploy output: $blockedDirectory"
        }
    }
}

$deployRoot = Assert-SafeSiblingPath -Path $deployRoot -ExpectedLeafPattern '^needsolar-deploy$'
$previousRoot = Assert-SafeSiblingPath -Path $previousRoot -ExpectedLeafPattern '^needsolar-deploy\.previous$'
$stagingRoot = Assert-SafeSiblingPath -Path $stagingRoot -ExpectedLeafPattern '^needsolar-deploy\.staging-[a-f0-9]{32}$'

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'index.html') -PathType Leaf)) {
    throw "Project root does not contain index.html: $projectRoot"
}

$publicFiles = @(Get-PublicSourceFiles)
if ($publicFiles.Count -eq 0) {
    throw 'No public files were selected for deployment.'
}

Test-PublicSourceSafety -Files $publicFiles
$sourceImageReferences = Test-ImageReferences -Root $projectRoot

if ($ValidateOnly) {
    [pscustomobject]@{
        Status          = 'validated'
        ProjectRoot     = $projectRoot
        PublicFiles     = $publicFiles.Count
        ImageReferences = $sourceImageReferences
        DeployChanged   = $false
    }
    exit 0
}

try {
    Copy-PublicFiles -Files $publicFiles
    Test-StagingMatchesSource -Files $publicFiles
    $stagedImageReferences = Test-ImageReferences -Root $stagingRoot

    if (Test-Path -LiteralPath $previousRoot) {
        Remove-Item -LiteralPath $previousRoot -Recurse -Force
    }

    $hadCurrentDeploy = Test-Path -LiteralPath $deployRoot
    if ($hadCurrentDeploy) {
        Move-Item -LiteralPath $deployRoot -Destination $previousRoot
    }

    try {
        Move-Item -LiteralPath $stagingRoot -Destination $deployRoot
    }
    catch {
        if ($hadCurrentDeploy -and
            -not (Test-Path -LiteralPath $deployRoot) -and
            (Test-Path -LiteralPath $previousRoot)) {
            Move-Item -LiteralPath $previousRoot -Destination $deployRoot
        }
        throw
    }

    [pscustomobject]@{
        Status          = 'built'
        ProjectRoot     = $projectRoot
        DeployRoot      = $deployRoot
        PreviousRoot    = if ($hadCurrentDeploy) { $previousRoot } else { $null }
        PublicFiles     = $publicFiles.Count
        ImageReferences = $stagedImageReferences
        DeployChanged   = $true
    }
}
catch {
    if (Test-Path -LiteralPath $stagingRoot) {
        Remove-Item -LiteralPath $stagingRoot -Recurse -Force
    }
    throw
}
