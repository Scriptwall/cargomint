$ErrorActionPreference = "Continue"
Set-Location "C:\Users\Efe-Dev\source\repos\GIGLOS_BK\apps\cargo-mint-web"
while ($true) {
  "[$(Get-Date -Format o)] starting next dev on 3000" | Out-File -FilePath frontend-3000.out.log -Append
  cmd.exe /c "npm.cmd run dev -- -p 3000 1>> frontend-3000.out.log 2>> frontend-3000.err.log"
  "[$(Get-Date -Format o)] next dev exited; restarting in 2s" | Out-File -FilePath frontend-3000.out.log -Append
  Start-Sleep -Seconds 2
}
