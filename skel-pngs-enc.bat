@echo off

set name=%~n1

ffmpeg -hide_banner -i "./assets/%name%.avs" ^
    -c:v libvpx-vp9 -b:v 0 -an ^
    -crf 28 -deadline best -y "./assets/%name%.webm"

pause
