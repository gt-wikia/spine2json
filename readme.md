:: extract illust skel+atlas+png
> skel-src-pma.bat admiral

:: make fixed skeleton
> skel-parse.bat illust_admiral

:: extract frames
> skel-frames.bat illust_admiral

:: gen bat for encoding
> skel-anim.bat illust_admiral
