# Meslo Nerd Font Installation (Host)

This project includes scripts to assist with installing the Meslo Nerd Font on your host system. Fonts must be installed on the local machine (the client) for Visual Studio Code to render glyphs in the integrated terminal. Installing fonts in the remote dev container is *not* enough for the client UI.

Linux (Ubuntu/Debian):

```
./scripts/install-meslo-host-fonts.sh
```

macOS:

```
./scripts/install-meslo-host-fonts.sh
```

Windows:

Run the PowerShell script with Administrator privileges:

```
powershell -ExecutionPolicy Bypass -File .\\scripts\\install-meslo-host-fonts.ps1
```

VS Code Settings:

Add or confirm the following values in User Settings (open Command Palette -> Preferences: Open Settings (JSON)):

``json
"terminal.integrated.fontFamily": "MesloLGM Nerd Font, MesloLGM Nerd Font Mono, monospace",
"editor.fontFamily": "MesloLGM Nerd Font Mono, MesloLGM Nerd Font, monospace",
```

After installing the fonts, restart VS Code or reload the window (`Developer: Reload Window`) and open a new integrated terminal to verify glyphs render correctly.

If using GitHub Codespaces in a browser, install the fonts on your local OS (host) to allow the browser and VS Code desktop app to render the glyphs.
