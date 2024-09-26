@echo off
setlocal

call batconfigs.bat

set _input=%~n1
"%_AR_APP%" "%_WORK_DIR%\%_input%" -q > nul
if "%~2" NEQ "" set "_input=%~n2" & set "_asset=%~n1" & set "_hasModelName=1"

xcopy "%_AR_SRC%\Assets\" "%_WORK_DIR%\_temp\" /E /C /I /Y /Q > nul

if "%_XDIR%" NEQ "1" goto extract

mkdir "%_WORK_DIR%\%_input%_temp"
if "%_hasModelName%" == "1" (
    copy "%_WORK_DIR%\%_asset%" "%_WORK_DIR%\%_input%_temp" > nul
) else (
    move "%_WORK_DIR%\%_input%" "%_WORK_DIR%\%_input%_temp" > nul
)
move "%_WORK_DIR%\%_input%_temp" "%_WORK_DIR%\%_input%"     > nul
move "%_WORK_DIR%\_temp" "%_WORK_DIR%\%_input%\_temp"       > nul
set _WORK_DIR=%_WORK_DIR%\%_input%

:extract
set _input_file=illust_%_input%
if "%_hasModelName%" == "1" set _input_file=%_input%

copy "%_WORK_DIR%\_temp\TextAsset\%_input_file%.skel.bytes"    "%_WORK_DIR%\%_input_file%.skel"  > nul
copy "%_WORK_DIR%\_temp\TextAsset\%_input_file%.atlas.txt"     "%_WORK_DIR%\%_input_file%.atlas" > nul
copy "%_WORK_DIR%\_temp\Texture2D\%_input_file%.rgba4444.png"  "%_WORK_DIR%\%_input_file%.png"   > nul
copy "%_WORK_DIR%\_temp\Texture2D\%_input_file%.png"           "%_WORK_DIR%\%_input_file%.png"   > nul
if "%_EXTBG%" == "1" ^
copy "%_WORK_DIR%\_temp\Texture2D\bg_%_input:illust_=%.png"    "%_WORK_DIR%\"                    > nul
rmdir /S /Q "%_WORK_DIR%\_temp\"

set _atlas_illust=%_WORK_DIR%/%_input_file%.atlas
set _texture_illust=%_WORK_DIR%/%_input_file%.png
if exist "%_atlas_illust%" goto unpack
goto end

:unpack

set _output=%_WORK_DIR%/images/
if "%_TSPINE%" == "1" set _output=%_WORK_DIR%/images_%_input%/

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
echo LOG: Input file: %_WORK_DIR%\%_input_file%
ffmpeg -loglevel error -i "%_pma_texture%" -vf ^"geq= ^
    r='min(r(X,Y)/alpha(X,Y)*255, 255)': ^
    g='min(g(X,Y)/alpha(X,Y)*255, 255)': ^
    b='min(b(X,Y)/alpha(X,Y)*255, 255)': ^
    a='alpha(X,Y)'" -y "%_texture_illust%"
if exist "%_texture_illust%" (echo LOG: DONE!) else goto end

:unpack-UPMA
"%_SPINE%" -u %_SV% -i "%_WORK_DIR%" -o "%_output%" -c "%_atlas_illust%"

if exist "%_pma_atlas%" del "%_atlas_illust:/=\%"
if exist "%_pma_texture%" del "%_texture_illust:/=\%" & ren "%_pma_texture:/=\%" "%_input_file%.png"

:end

endlocal
pause
