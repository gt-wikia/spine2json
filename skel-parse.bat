@echo off
setlocal

call batconfigs.bat

set _input=%~n1
set _input_file=illust_%_input%
if "%_XDIR%" == "1" set _WORK_DIR=%_WORK_DIR%\%_input%
if not exist "%_WORK_DIR%\%_input_file%.skel" set _input_file=%_input%

node "%_PARSE_SKEL%" "%_input_file%"

endlocal
pause
