@echo off

set arp=D:\Programs\PortableSoft\AssetRipper
set unp="%arp%\AssetRipper.exe"
set out=%arp%\Ripped\ExportedProject

set inp=%~n1
%unp% "./assets/%inp%" -q

xcopy "%out%\Assets" "./assets/_temp" /E /H /C /I /Y
copy /Y /V ".\assets\_temp\TextAsset\illust_%inp%.skel.bytes"   ".\assets\illust_%inp%.skel"
copy /Y /V ".\assets\_temp\TextAsset\illust_%inp%.atlas.txt"    ".\assets\illust_%inp%.atlas"
copy /Y /V ".\assets\_temp\Texture2D\illust_%inp%.rgba4444.png" ".\assets\illust_%inp%.png"
rmdir /S /Q "./assets/_temp"

pause
