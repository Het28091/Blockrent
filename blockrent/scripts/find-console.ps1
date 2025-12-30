# Script to find all console.* usage in backend routes
Get-ChildItem -Path "e:\blockrent\blockrent\backend\routes" -Filter "*.js" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    if ($content -match 'console\.(log|error|warn)') {
        Write-Host "`n=== $($_.Name) ==="
        Select-String -Path $file -Pattern 'console\.(log|error|warn)' | ForEach-Object {
            Write-Host "Line $($_.LineNumber): $($_.Line.Trim())"
        }
    }
}
