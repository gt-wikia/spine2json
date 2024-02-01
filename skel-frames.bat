@echo off
setlocal

call batconfigs.bat

set _input=%~n1
set _input_file=illust_%_input%
if "%_XDIR%" == "1" set _WORK_DIR=%_WORK_DIR%\%_input%
if not exist "%_WORK_DIR%\%_input_file%.skel" set _input_file=%_input%

set _input_skel=%_WORK_DIR%\%_input_file%.skel
set _patch_json=%_WORK_DIR%\%_input_file%.s2j.json
set _patch_skel=%_WORK_DIR%\%_input_file%.s2j.skel

set _frames_dir=frames
if "%_TSPINE%" == "1" set _frames_dir=frames_%_input_file%

if not exist "%_patch_json%" echo LOG: %_patch_json% not found. Use skel-parse.bat & goto end

echo LOG: Input file: %_WORK_DIR%\%_input_file%
"%_SPINE%" -u %_SV3% -i "%_patch_json%" -o "%_WORK_DIR%" -e "%_SCFG_J2SKEL%" > nul
echo LOG: DONE!

"%_SPINE%" -u %_SV3% -i "%_patch_skel%" -o "%_WORK_DIR%/%_frames_dir%/%_input%-idle" -e "%_SCFG_FRAMES%"
if exist "%_patch_skel%" del "%_patch_skel%"

for /f %%A in ('dir /a:-d /s /b "%_WORK_DIR%/%_frames_dir%/" ^| find /c "\%_input%-idle"') do set _last_frame=%%A
if "%_last_frame%" == "0" echo LOG: No frames found inside %_WORK_DIR%\%_frames_dir% & goto end
set /a _last_frame=%_last_frame%-1
set _first_frame=%_last_frame%
for /l %%A in (0,1,9) do call set _first_frame=%%_first_frame:%%A=0%%

set _first_frame_file=%_WORK_DIR%\%_frames_dir%\%_input%-idle_%_first_frame%.png
set _last_frame_file=%_WORK_DIR%\%_frames_dir%\%_input%-idle_%_last_frame%.png

"%_first_frame_file%"
"%_last_frame_file%"
for %%A in ("%_first_frame_file%") do set _sizeF=%%~zA
for %%A in ("%_last_frame_file%") do set _sizeL=%%~zA
set /a _sizecmp=%_sizeF%-%_sizeL%
if %_sizecmp% LSS 600 if %_sizecmp% GTR -600 set /p _del_frameL="LOG: Identical loop frame found. Delete last frame? "
if /i "%_del_frameL%" == "y" del "%_last_frame_file%" & echo LOG: Deleted %_last_frame_file%

:end

endlocal
pause
