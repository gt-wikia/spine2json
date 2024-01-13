import fs from 'fs';

const filePrefix = './assets/';
const args = process.argv;
const argc = args.length > 2 ? true : false;
const vargs = process.argv.slice(3);
const a = { pt: 20, pl: 20, pr: 20, pb: 20, ct: 0, cl: 0, cr: 0, cb: 0 };

function exit(){
    console.log('[APP] Wrong args');
    console.log(args);
    process.exit();
}

if(argc && args[2].match(/\\/) || argc && args[2].match(/\//)){
    help();
}

if(args.length < 2) {
    help();
}

for(let i in vargs){
    i = parseInt(i);
    if(i + 2 > vargs.length){
        break;
    }
    const v1 = vargs[i];
    const v2 = vargs[i+1];
    if(v1.match(/^-(p|c)(t|l|r|b)$/) && v2.match(/^\d+$/)){
        a[v1.split('-')[1]] = parseInt(v2);
    }
}

const fileName = args[2];
console.log('LOG: Input file:', filePrefix + fileName);
console.log();

let out = ``;
out += `@echo off\n`;
out += `\n`;
out += `set _input_img=./${process.env._frames_dir}/${process.env._input}-idle_%%02d.png\n`;
out += `ffprobe -hide_banner -i "%_input_img%"\n`;
out += `echo.\n`;
out += `\n`;
out += `:pad_val\n`;
out += `set _pt=${a.pt}\n`;
out += `set _pr=${a.pl}\n`;
out += `set _pb=${a.pr}\n`;
out += `set _pl=${a.pb}\n`;
out += `\n`;
out += `:crop_val\n`;
out += `set _ct=${a.ct}\n`;
out += `set _cl=${a.cl}\n`;
out += `set _cr=${a.cr}\n`;
out += `set _cb=${a.cb}\n`;
out += `\n`;
out += `:scale0\n`;
out += `set _filters=scale=iw:ih:flags=spline\n`;
out += `\n`;
out += `:pad\n`;
out += `set _filters=%_filters%,pad=iw+%_pl%+%_pr%:ih+%_pt%+%_pb%:%_pl%:%_pt%:#00000000\n`;
out += `\n`;
out += `:crop\n`;
out += `set _do_crop=0\n`;
out += `set _offset_t=0\n`;
out += `set _offset_l=0\n`;
out += `if %_ct% == 0 (set _pt=0) else (set _do_crop=1 & set /a _offset_t=%_ct%+%_pt%)\n`;
out += `if %_cl% == 0 (set _pl=0) else (set _do_crop=1 & set /a _offset_l=%_cl%+%_pl%)\n`;
out += `if %_cr% == 0 (set _pr=0) else (set _do_crop=1)\n`;
out += `if %_cb% == 0 (set _pb=0) else (set _do_crop=1)\n`;
out += `if %_do_crop% == 0 goto scale\n`;
out += `set _filters=%_filters%,crop=iw-%_cl%-%_cr%-%_pl%-%_pr%:ih-%_ct%-%_cb%-%_pt%-%_pb%:%_offset_l%:%_offset_t%\n`;
out += `\n`;
out += `:scale\n`;
out += `set _filters=%_filters%,scale=iw/2:ih/2:flags=spline\n`;
out += `\n`;
out += `:encode\n`;
out += `set _run_ffmpeg=N\n`;
out += `set /p _run_ffmpeg=Run FFmpeg (y/N)? \n`;
out += `if /I "%_run_ffmpeg%" NEQ "y" goto skip\n`;
out += `echo %_filters%\n`;
out += `ffmpeg -hide_banner -framerate 18 -i "%_input_img%" ^\n`;
out += `    -c:v libvpx-vp9 -b:v 0 -an -crf 28 ^\n`;
out += `    -filter_complex "%_filters%" -deadline best ^\n`;
out += `    -y "./${process.env._input}.webm"\n`;
out += `\n`;
out += `:skip\n`;
out += `pause\n`;

fs.writeFileSync(filePrefix + fileName + '.bat', out);
