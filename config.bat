@echo off

:: app paths
set _SPINE=C:\Program Files\Spine\Spine.com
set _AR_DIR=D:\Programs\PortableSoft\AssetRipper
set _AR_APP=%_AR_DIR%\AssetRipper.exe
set _AR_SRC=%_AR_DIR%\Ripped\ExportedProject

:: spine configs
set _SCFG_FRAMES=./configs/spine-to-pngs.json

:: scripts
set _PATCH_ATLAS=./scripts/patch-atlas-json.mjs
set _PARSE_SKEL=./scripts/parse-spine-skel.mjs

:: set default spine verison
:: SV3 is 3.x, SV4 is 4.x
set _SV3=3.8.87
set _SV4=4.1.24

:: personal images/frames folder
:: if 1 = true, otherwise false
set _TSPINE=1
