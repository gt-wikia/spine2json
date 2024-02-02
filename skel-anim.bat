@echo off
setlocal

call batconfigs.bat

set _input=%~n1
set _input_file=illust_%_input%
set _avs_Gpath=%_WORK_DIR%
set _avs_Lpath=%~dp0
if "%_XDIR%" == "1" set "_WORK_DIR=%_WORK_DIR%\%_input%"
if not exist "%_WORK_DIR%\%_input_file%.skel" set _input_file=%_input%

set _frames_dir=frames
if "%_TSPINE%" == "1" set _frames_dir=frames_%_input%

for /f %%A in ('dir /a:-d /s /b "%_WORK_DIR%/%_frames_dir%/" ^| find /c "\%_input%-idle"') do set _last_frame=%%A
if "%_last_frame%" == "0" echo LOG: No frames found inside %_WORK_DIR%\%_frames_dir% & goto end
set /a _last_frame=%_last_frame%-1

echo.
ffprobe -hide_banner -i "%_WORK_DIR%\%_frames_dir%\%_input%-idle_%_last_frame%.png"
echo.

set _global_avs="frame-calc.avs"
set _local_avs="%_WORK_DIR%\%_input_file%.avs"

call :write-global-avs > %_global_avs%

:local-avs
set _avs_args=
set /p _avs_args="LOG: Frame pad/crop [p|c][t|l|r|b] ? "
call :write-local-avs %_avs_args% > %_local_avs%
if errorlevel 1 (
    echo Invalid argument "%_errorarg%". Please try again.
    echo Error in skel-anim.bat call > %_local_avs%
    goto local-avs
)

echo LOG: Successfully created: %_local_avs:\=/%
echo LOG: Proceeding with FFmpeg encoding...

pause
echo ffmpeg -hide_banner -i %_local_avs% -c:v libvpx-vp9 -an ^
 -b:v 0 -crf 25 -row-mt 1 -tile-columns 2 -threads 4 -deadline best ^
 -y "%_WORK_DIR%\%_input_file%.webm" > .make-ffmpeg_temp.bat

start /belownormal /b /w cmd /C ".make-ffmpeg_temp.bat"
del ".make-ffmpeg_temp.bat"

set _output=%_WORK_DIR%\%_input_file%.webm
if exist "%_output%" "%_output%"

:end

endlocal
exit /b

:write-global-avs
  set _avs_Gpath="%_avs_Gpath:\=/%/"
  if "%_XDIR%" == "1" (set _avs_Gpath=%_avs_Gpath%+name)
  if "%_TSPINE%" == "1" (set _avs_Gpath=%_avs_Gpath%+"/frames_"+name+"/") ^
    else (set _avs_Gpath=%_avs_Gpath%+"/frames/")
  echo #name = "%_input%"
  echo #frames = %_last_frame%
  echo src = %_avs_Gpath%+name+"-idle_%%0"+String(StrLen(String(frames)))+"d.png"
  echo i = ImageSource(src, start=0, end=frames, fps=18, pixel_type="RGB32")
  echo pt = VarExist("pt") ? pt : 20
  echo pl = VarExist("pl") ? pl : 20
  echo pr = VarExist("pr") ? pr : 20
  echo pb = VarExist("pb") ? pb : 20
  echo ct = VarExist("ct") ? ct+pt : 0
  echo cl = VarExist("cl") ? cl+pl : 0
  echo cr = VarExist("cr") ? cr+pr : 0
  echo cb = VarExist("cb") ? cb+pb : 0
  echo i = i.AddBorders(pl, pt, pr, pb, color=$00000000)
  echo i = i.crop(cl, ct, -cr, -cb)
  echo i = makemod2(i)
  echo w = i.Width()
  echo h = i.Height()
  echo scl = %_ANIM_SCALE%
  echo i = i.Spline64Resize(Int(w*scl), Int(h*scl))
  echo i = makemod2(i)
  echo return i
  echo.
  echo function makemod2(clip i) {
  echo     pt = i.Height()%%2 == 0 ? 0 : 1
  echo     pl = i.Width()%%2 == 0 ? 0 : 1
  echo     i = i.AddBorders(pl, pt, 0, 0, color=$00000000)
  echo     return i
  echo }
  exit /b

:write-local-avs
  set _avs_Lpath=%_avs_Lpath:\=/%
  echo name = "%_input%"
  echo frames = %_last_frame%
    :loop
    set _hasArgs=%1
    if not defined _hasArgs goto endloop
        set "key=%1" & set "val=%2"
            echo %key%| findstr /xr "[pc][tlrb]" > nul
            if errorlevel 1 set "_errorarg=%key%" & exit /b
            echo %val%| findstr /xr "[0-9][0-9]*" > nul
            if errorlevel 1 set "_errorarg=%val%" & exit /b
        echo %key% = %val%
        shift & shift
    goto loop
    :endloop
  echo.
  echo Import("%_avs_Lpath%frame-calc.avs")
  exit /b 0
