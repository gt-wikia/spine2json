@echo off
setlocal

call batconfigs.bat

set _input=%~n1
"%_AR_APP%" ".\assets\%_input%" -q > nul

xcopy "%_AR_SRC%\Assets\" ".\assets\_temp\" /E /C /I /Y /Q > nul

copy ".\assets\_temp\TextAsset\illust_%_input%.skel.bytes"    ".\assets\illust_%_input%.skel"  > nul
copy ".\assets\_temp\TextAsset\illust_%_input%.atlas.txt"     ".\assets\illust_%_input%.atlas" > nul
copy ".\assets\_temp\Texture2D\illust_%_input%.rgba4444.png"  ".\assets\illust_%_input%.png"   > nul
rmdir /S /Q ".\assets\_temp\"

set _input_file=illust_%_input%
set _atlas_illust=./assets/%_input_file%.atlas

if exist "%_atlas_illust%" goto unpack
goto end

:unpack

set _output=%_WORK_DIR%/images/
if "%_TSPINE%" == "1" set _output=%_WORK_DIR%/images_%_input_file%/

if "%_UPMA%" NEQ "1" set "_SV=%_SV3%" & goto unpack-UPMA
if defined _SV4 goto Spine
goto FFmpeg

:Spine
set _SV=%_SV4%
set _pma_atlas=%_WORK_DIR%/%_input_file%.pma.atlas
node "%_PATCH_ATLAS%" "%_WORK_DIR%/%_input_file%"
set _atlas_illust=%_pma_atlas%
goto unpack-UPMA

:FFmpeg
set _SV=%_SV3%
set _pma_texture=%_WORK_DIR%/%_input_file%.pma.png
ren "%_texture_illust:/=\%" "%_input_file%.pma.png"
ffmpeg -hide_banner -loglevel error -i "%_pma_texture%" -vf ^"geq= ^
    r='min(r(X,Y)/alpha(X,Y)*255, 255)': ^
    g='min(g(X,Y)/alpha(X,Y)*255, 255)': ^
    b='min(b(X,Y)/alpha(X,Y)*255, 255)': ^
    a='alpha(X,Y)'" -y -update 1 "%_texture_illust%"

:unpack-UPMA
"%_SPINE%" -u %_SV% -i "%_WORK_DIR%" -o "%_output%" -c "%_atlas_illust%"


:end

endlocal
pause
