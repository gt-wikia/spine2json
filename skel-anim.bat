@echo off
setlocal

call config.bat

set _input=%~n1
set _input_skel=./assets/%_input%.skel
if exist "./assets/%_input%.s2j.json" set _input_skel=./assets/%_input%.s2j.json

set _frames_dir=frames
if "%_TSPINE%" == "1" set _frames_dir=frames_%_input%

"%_SPINE%" -u %_SV3% -i %_input_skel% -o ./assets/%_frames_dir%/%_input%-idle -e "%_SCFG_FRAMES%"

for /f %%A in ('dir /a:-d /s /b "./assets/%_frames_dir%/" ^| find /c ":\"') do set _endFrame=%%A
set /a _endFrame=%_endFrame%-1

echo i = ImageSource("%_frames_dir%/%_input%-idle_%%02d.png", start=0, end=%_endFrame%, fps=18, pixel_type="RGB32") > ./assets/%_input%.avs
echo iw = i.Width()                                                                                                 >>./assets/%_input%.avs
echo ih = i.Height()                                                                                                >>./assets/%_input%.avs

echo pad_iw = float(pad_val(iw))                                                                                    >>./assets/%_input%.avs
echo pad_ih = float(pad_val(ih))                                                                                    >>./assets/%_input%.avs
echo pad_top = ceil(pad_ih / 2)                                                                                     >>./assets/%_input%.avs
echo pad_right = floor(pad_iw / 2)                                                                                  >>./assets/%_input%.avs
echo pad_bottom = floor(pad_ih / 2)                                                                                 >>./assets/%_input%.avs
echo pad_left = ceil(pad_iw / 2)                                                                                    >>./assets/%_input%.avs
echo i = i.AddBorders(pad_left, pad_top, pad_right, pad_bottom, color=$00000000)                                    >>./assets/%_input%.avs

rem Spline64Resize -> Spline36Resize -> BicubicResize
echo iw = i.Width()                                                                                                 >>./assets/%_input%.avs
echo ih = i.Height()                                                                                                >>./assets/%_input%.avs
echo i = i.Spline64Resize(iw/2, ih/2)                                                                               >>./assets/%_input%.avs
echo i = i.AddBorders(10, 10, 10, 10, color=$00000000)                                                              >>./assets/%_input%.avs
echo i = i.ConvertToPlanarRGBA()                                                                                    >>./assets/%_input%.avs
echo i = i.ConvertToYUV420()                                                                                        >>./assets/%_input%.avs
echo return i                                                                                                       >>./assets/%_input%.avs

echo function pad_val(size) {                                                                                       >>./assets/%_input%.avs
echo     if (size %% 4 == 0)  { return 0 }                                                                          >>./assets/%_input%.avs
echo     return 4 - size %% 4                                                                                       >>./assets/%_input%.avs
echo }                                                                                                              >>./assets/%_input%.avs

:: ffmpeg -hide_banner -i "./assets/%_input%.avs" ^
::     -c:v libvpx-vp9 -b:v 0 -an ^
::     -crf 28 -deadline best -y "./assets/%_input%.webm"

endlocal
pause
