param(
    [string]$MavenVersion = '3.9.5'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetDir = Join-Path $root '..' | Resolve-Path | Select-Object -ExpandProperty Path
$installDir = Join-Path $targetDir '.maven'

if (-not (Test-Path $installDir)) {
    Write-Host "Creating local Maven directory: $installDir"
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# If the extracted folder already exists, skip download
$extracted = Join-Path $installDir "apache-maven-$MavenVersion"
if (Test-Path $extracted) {
    Write-Host "Local Maven already installed at $extracted"
    exit 0
}

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
        Write-Host "Trying to download Maven $MavenVersion from $url"
        Invoke-WebRequest -Uri $url -OutFile $tmpZip -UseBasicParsing -ErrorAction Stop
        $downloaded = $true
        break
    } catch {
        Write-Host "Download from $url failed: $($_.Exception.Message)"
    }
}
if (-not $downloaded) {
    Write-Error "Unable to download Maven $MavenVersion from known mirrors. Please check network or provide a URL."
    exit 1
}

Write-Host "Extracting $tmpZip to $installDir"
Expand-Archive -Path $tmpZip -DestinationPath $installDir

# Move extracted folder up one level so path is .maven/apache-maven-<ver>
$extracted = Join-Path $installDir "apache-maven-$MavenVersion"
if (-not (Test-Path $extracted)) {
    Write-Error "Extraction failed or unexpected layout."
    exit 1
}

Write-Host "Local Maven installed at $extracted"
Remove-Item $tmpZip -Force

Write-Host "Done. You can run .\\mvnw.cmd from the Backend folder to use the local Maven." 
