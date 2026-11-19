$tempDirs = @($env:TEMP, "$env:SystemRoot\Temp")
$deletedCount = 0
$freedBytes = 0

foreach ($dir in $tempDirs) {
  if (Test-Path $dir) {
    Get-ChildItem -Path $dir -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
      try {
        $size = $_.Length
        Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop
        $deletedCount++
        if ($size) { $freedBytes += $size }
      } catch {}
    }
  }
}

[PSCustomObject]@{
  DeletedFiles = $deletedCount
  FreedBytes = $freedBytes
} | ConvertTo-Json
