#!/bin/sh
# Turn a short landscape clip into the hero's slow, seamless background loop.
#   sh tools/make_hero_loop.sh input.mp4 [speed]      (speed defaults to 0.6 = 60% of real time)
# Writes assets/video/lavender-{desktop,mobile}.{mp4,webm} and assets/img/lavender-{desktop,mobile}-poster.webp.
# Slowing uses motion interpolation so playback stays smooth at 24 fps; the clip's last 2 s are
# crossfaded into its first 2 s so the loop has no visible jump. The phone cut is a centred 9:16 crop.
set -eu
IN="$1"; SPEED="${2:-0.6}"; FADE=2
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
ffmpeg -hide_banner -loglevel error -y -i "$IN" -an \
  -vf "setpts=PTS/$SPEED,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p "$TMP/slow.mp4"
T=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/slow.mp4")
E=$(awk -v t="$T" -v d="$FADE" 'BEGIN { print t - d }')
ffmpeg -hide_banner -loglevel error -y -i "$TMP/slow.mp4" -filter_complex \
  "[0]split=3[a][b][c];[a]trim=0:$FADE,setpts=PTS-STARTPTS[head];[b]trim=$FADE:$E,setpts=PTS-STARTPTS[mid];[c]trim=$E:$T,setpts=PTS-STARTPTS[tail];[tail][head]xfade=transition=fade:duration=$FADE:offset=0[x];[x][mid]concat=n=2:v=1:a=0,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 10 -preset fast "$TMP/loop.mp4"
W=$(ffprobe -v error -select_streams v -show_entries stream=width -of csv=p=0 "$TMP/loop.mp4")
H=$(ffprobe -v error -select_streams v -show_entries stream=height -of csv=p=0 "$TMP/loop.mp4")
CW=$((H * 9 / 16 / 2 * 2))
DESK="scale=1280:720:flags=lanczos"
MOB="crop=$CW:$H:$(((W - CW) / 2)):0,scale=540:960:flags=lanczos"
X264="-c:v libx264 -preset slower -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 -movflags +faststart -an -map_metadata -1 -crf 27"
VP9="-c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -an -map_metadata -1"
for cut in desktop mobile; do
  [ "$cut" = desktop ] && VF="$DESK" || VF="$MOB"
  ffmpeg -hide_banner -loglevel error -y -i "$TMP/loop.mp4" -vf "$VF" $X264 "assets/video/lavender-$cut.mp4"
  ffmpeg -hide_banner -loglevel error -y -i "$TMP/loop.mp4" -vf "$VF" $VP9 "assets/video/lavender-$cut.webm"
  ffmpeg -hide_banner -loglevel error -y -i "$TMP/loop.mp4" -vf "$VF" -frames:v 1 -c:v libwebp -quality 78 "assets/img/lavender-$cut-poster.webp"
done
ls -l assets/video/lavender-* assets/img/lavender-*-poster.webp
