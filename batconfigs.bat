@echo off

:: app paths
set _SPINE=C:\Program Files\Spine\Spine.com
set _AR_DIR=D:\Programs\PortableSoft\AssetRipper
set _AR_APP=%_AR_DIR%\AssetRipper.exe
set _AR_SRC=%_AR_DIR%\Ripped\ExportedProject

:: spine configs
set _SCFG_FRAMES=./configs/spine-to-pngs.json
set _SCFG_J2SKEL=./configs/spine-to-skel.json

:: scripts
set _PATCH_ATLAS=./scripts/patch-atlas-json.mjs
set _PARSE_SKEL=./scripts/parse-spine-skel.mjs
set _MAKE_FFMPEG=./scripts/make-enc.mjs

:: working/playground directory
:: defaults to assets folder
set _WORK_DIR=.\assets

:: set default spine verison
:: SV3 is 3.x, SV4 is 4.x
:: leave SV4 empty if v4.x not installed
set _SV3=3.8.87
set _SV4=4.1.24

:::::::::::::::::::::::::::::
:: config toggles
:: 1 == true, otherwise false
:::::::::::::::::::::::::::::

:: personal images/frames folder
set _TSPINE=0

:: assign personal/exclusive folder for each asset
set _XDIR=1

:: unpremultiply alpha; remove black edges from texture
set _UPMA=1

:: also extract character bg
set _EXTBG=0

:::::::::::::::::::::::::::::

:: scale factor to resize animated video resolution
:: 1 == no resize
set _ANIM_SCALE=0.5
