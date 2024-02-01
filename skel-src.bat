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

set _output=./assets/images/
if "%_TSPINE%" == "1" set _output=./assets/images_%_input_file%/

"%_SPINE%" -u %_SV4% -i "./assets" -o "%_output%" -c "%_atlas_illust%"

:end

endlocal
pause
