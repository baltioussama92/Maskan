param(
    [string]$MavenVersion = '3.9.5'
)

$ErrorActionPreference = 'Stop'

Write-Host "Installing Apache Maven $MavenVersion for current user..."

$zipName = "apache-maven-$MavenVersion-bin.zip"
$tmpZip = Join-Path $env:TEMP $zipName

$candidates = @(
    "https://dlcdn.apache.org/maven/maven-3/$MavenVersion/binaries/$zipName",
    "https://downloads.apache.org/maven/maven-3/$MavenVersion/binaries/$zipName",
    "https://archive.apache.org/dist/maven/maven-3/$MavenVersion/binaries/$zipName"
)

$downloaded = $false
foreach ($url in $candidates) {
    try {
        Write-Host "Trying $url"
        Invoke-WebRequest -Uri $url -OutFile $tmpZip -UseBasicParsing -ErrorAction Stop
        $downloaded = $true
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)"
    }
}

if (-not $downloaded) {
    Write-Error "Unable to download Maven $MavenVersion from known mirrors."
    exit 1
}

$installParent = Join-Path $env:USERPROFILE 'tools'
if (-not (Test-Path $installParent)) { New-Item -ItemType Directory -Path $installParent | Out-Null }

$installDir = Join-Path $installParent "apache-maven-$MavenVersion"
if (Test-Path $installDir) {
    Write-Host "Maven already installed at $installDir"
} else {
    Write-Host "Extracting to $installParent"
    Expand-Archive -Path $tmpZip -DestinationPath $installParent -Force
}

if (Test-Path $tmpZip) {
    try {
        Remove-Item -LiteralPath $tmpZip -Force -ErrorAction Stop
    } catch {
        Write-Host "Warning: unable to remove temp zip: $($_.Exception.Message)"
    }
}

$mvnBin = Join-Path $installDir 'bin'
if (-not (Test-Path $mvnBin)) {
    Write-Error "Extraction failed: $mvnBin not found"
    exit 1
}

# Update user PATH
$currentPath = [Environment]::GetEnvironmentVariable('Path','User')
$add = $mvnBin
if ($currentPath -notlike "*${add}*") {
    $newPath = if ($currentPath -and $currentPath.Trim() -ne '') { "$currentPath;$add" } else { $add }
    [Environment]::SetEnvironmentVariable('Path',$newPath,'User')
    Write-Host "Updated user PATH to include $add"
} else {
    Write-Host "User PATH already contains $add"
}

Write-Host "Apache Maven $MavenVersion installed. Close and reopen your terminal to pick up the new PATH, or run:`n$env:Path += ';' + '$add'`nThen verify with `mvn -version`."
