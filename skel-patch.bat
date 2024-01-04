@echo off

set name=%~n1
set expCfg=./spine-skel2json.json
"C:/Program Files/Spine/Spine.com" -i ./assets/%name%.skel -o ./assets/ -e "%expCfg%"
node app-patch %name%
