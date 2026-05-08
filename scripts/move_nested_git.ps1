Set-Location -Path 'D:\bakery-backend'
$g = Get-ChildItem -Path 'services' -Recurse -Directory -Force -Filter '.git' -ErrorAction SilentlyContinue
if ($g) {
  foreach ($d in $g) {
    Write-Output "Found: $($d.FullName)"
    $dest = $d.FullName + '.backup'
    Move-Item -LiteralPath $d.FullName -Destination $dest -Force -ErrorAction SilentlyContinue
    Write-Output "Moved to: $dest"
  }
} else {
  Write-Output 'No nested .git found'
}

# retry add and commit
 $addOutput = git add . 2>&1
 Write-Output $addOutput
 $commitOutput = git commit -m 'Initial commit' 2>&1
 Write-Output $commitOutput
