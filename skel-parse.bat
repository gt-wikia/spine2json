@echo off
setlocal

call batconfigs.bat

set _input=%~n1
node "%_PARSE_SKEL%" "%_input%"

endlocal
pause
