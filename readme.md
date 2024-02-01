## Syntax
:: extract illust skel+atlas+texture
```cmd
> skel-src.bat [<asset>] [<model>]?
```

:: fix skeleton scaling
```cmd
> skel-parse.bat [<foldername>|<model>]
```

:: export frames
```cmd
> skel-frames.bat [<foldername>|<model>]
```

:: encode frames into `webm` video
```cmd
> skel-anim.bat [<foldername>|<model>]
```

## Examples
### Singular Unity Asset
```cmd
skel-src.bat admiral
skel-parse.bat admiral
skel-frames.bat admiral
skel-anim.bat admiral
```

### Compound Unity Asset
```cmd
skel-src.bat visual_novel novel_illust_kaden
skel-parse.bat novel_illust_kaden
skel-frames.bat novel_illust_kaden
skel-anim.bat novel_illust_kaden
```
