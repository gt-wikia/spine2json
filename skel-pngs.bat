@echo off

set name=%~n1
set expCfg=./jsons/spine-to-pngs.json
"C:/Program Files/Spine/Spine.com" -i ./assets/%name%_j2p.skel -o ./assets/frames_%name%/%name%-idle -e "%expCfg%"
for /f %%A in ('dir /a:-d /s /b "./assets/frames_%name%/" ^| find /c ":\"') do set endFrame=%%A
set /a endFrame=%endFrame%-1

echo i = ImageSource("frames_%name%/%name%-idle_%%02d.png", start=0, end=%endFrame%, fps=18, pixel_type="RGB32") > ./assets/%name%.avs
echo iw = i.Width()                                                                                              >>./assets/%name%.avs
echo ih = i.Height()                                                                                             >>./assets/%name%.avs

echo pad_iw = float(pad_val(iw))                                                                                 >>./assets/%name%.avs
echo pad_ih = float(pad_val(ih))                                                                                 >>./assets/%name%.avs
echo pad_top = ceil(pad_ih / 2)                                                                                  >>./assets/%name%.avs
echo pad_right = floor(pad_iw / 2)                                                                               >>./assets/%name%.avs
echo pad_bottom = floor(pad_ih / 2)                                                                              >>./assets/%name%.avs
echo pad_left = ceil(pad_iw / 2)                                                                                 >>./assets/%name%.avs
echo i = i.AddBorders(pad_left, pad_top, pad_right, pad_bottom, color=$00000000)                                 >>./assets/%name%.avs

rem Spline64Resize -> Spline36Resize -> BicubicResize
echo iw = i.Width()                                                                                              >>./assets/%name%.avs
echo ih = i.Height()                                                                                             >>./assets/%name%.avs
echo i = i.Spline64Resize(iw/2, ih/2)                                                                            >>./assets/%name%.avs
echo i = i.AddBorders(10, 10, 10, 10, color=$00000000)                                                           >>./assets/%name%.avs
echo i = i.ConvertToPlanarRGBA()                                                                                 >>./assets/%name%.avs
echo i = i.ConvertToYUV420()                                                                                     >>./assets/%name%.avs
echo return i                                                                                                    >>./assets/%name%.avs

echo function pad_val(size) {                                                                                    >>./assets/%name%.avs
echo     if (size %% 4 == 0)  { return 0 }                                                                       >>./assets/%name%.avs
echo     return 4 - size %% 4                                                                                    >>./assets/%name%.avs
echo }                                                                                                           >>./assets/%name%.avs
