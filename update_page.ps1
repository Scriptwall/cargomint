$path = 'apps\cargo-mint-web\src\app\(tenant-admin)\tenant-console\page.tsx'
$content = Get-Content $path
$content | ForEach-Object {
    $_
    if ($_ -match "\| 'modal-confirm'") {
        "  | 'modal-profile'"
    }
} | Set-Content "${path}.tmp"
Move-Item "${path}.tmp" $path -Force
