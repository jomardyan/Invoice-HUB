Param()

# PowerShell script to install Meslo Nerd Fonts on Windows (local host).
# Usage: Run PowerShell as Administrator and execute:
#   .\scripts\install-meslo-host-fonts.ps1

Write-Host "Downloading latest Meslo Nerd Font (zip) from NerdFonts GitHub releases..."
$url = "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/Meslo.zip"
$tmp = "$env:TEMP\Meslo.zip"
Invoke-WebRequest -Uri $url -OutFile $tmp
Write-Host "Extracting fonts to C:\Windows\Fonts (requires admin)..."
try {
    $shell = New-Object -ComObject Shell.Application
    $zip   = $shell.NameSpace($tmp)
    $dest  = $shell.NameSpace('C:\Windows\Fonts')
    $dest.CopyHere($zip.Items())
    Write-Host "Installed (copied) fonts to C:\Windows\Fonts"
} catch {
    Write-Host "Unable to copy to C:\Windows\Fonts. You may need to manually extract and install the fonts.", $_.Exception.Message
}

Write-Host "Please restart VS Code and verify the font is enabled in Settings -> Terminal -> Integrated -> Font Family: MesloLGM Nerd Font";
