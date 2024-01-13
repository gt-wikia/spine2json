@echo off
setlocal

call config.bat

set _input=%~n1

set _assets=.\assets
set _input_skel=%_assets%\%_input%.skel
set _input_json=%_assets%\%_input%.s2j.json
set _patch_skel=%_assets%\%_input%.s2j.skel

set _frames_dir=frames
if "%_TSPINE%" == "1" set _frames_dir=frames_%_input%

if not exist "%_input_json%" goto make-frames

:convert-json
"%_SPINE%" -u %_SV3% -i "%_input_json%" -o "%_assets%" -e "%_SCFG_J2SKEL%"
set _input_skel=%_patch_skel%

:make-frames
"%_SPINE%" -u %_SV3% -i "%_input_skel%" -o ./assets/%_frames_dir%/%_input%-idle -e "%_SCFG_FRAMES%"
if exist "%_patch_skel%" del %_patch_skel%

endlocal
pause
