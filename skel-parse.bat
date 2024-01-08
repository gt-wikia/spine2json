@echo off
setlocal

call config.bat

set _input=%~n1
node "%_PARSE_SKEL%" "%_input%"

endlocal
pause
