$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$source = "C:\Users\mmath\.gemini\antigravity\scratch\universal-dpp-traceability"
$zipPath = "C:\Users\mmath\.gemini\antigravity\scratch\universal-dpp-traceability.zip"
$tempDir = "C:\Users\mmath\.gemini\antigravity\scratch\zip_staging"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Robocopy to temp dir excluding node_modules and .git
robocopy $source $tempDir /E /XD node_modules .git /XF *.log | Out-Null

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
Remove-Item -Recurse -Force $tempDir

Get-Item $zipPath | Select-Object Name, Length, LastWriteTime
Write-Host "ZIP created successfully at $zipPath"
