@echo off
setlocal

call config.bat

set _input=%~n1
set _input_skel=./assets/%_input%.skel

set _frames_dir=frames
if "%_TSPINE%" == "1" set _frames_dir=frames_%_input%

for /f %%A in ('dir /a:-d /s /b "./assets/%_frames_dir%/" ^| find /c "\%_input%-idle"') do set _last_frame=%%A
set /a _last_frame=%_last_frame%-1

node "%_MAKE_FFMPEG%" %*
start /belownormal /b /w /d "./assets/" cmd /C "%_input%.bat"

endlocal
pause
