@echo off

set name=%~n1
set expCfg=./jsons/spine-to-pngs.json
"C:/Program Files/Spine/Spine.com" -i ./assets/%name%_j2p.skel -o ./assets/frames_%name%/%name%-idle -e "%expCfg%"
