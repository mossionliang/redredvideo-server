#!/bin/bash
# 下载可用的测试视频
urls=(
  "https://www.w3schools.com/html/movie.mp4"
  "https://www.w3schools.com/html/mov_bbb.mp4"
  "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
  "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4"
  "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_5mb.mp4"
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4"
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4"
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4"
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4"
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4"
  "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4"
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4"
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4"
  "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
)

count=0
for i in "${!urls[@]}"; do
  idx=$((i + 5))
  fname="sample${idx}.mp4"
  echo "[$((i+1))/${#urls[@]}] 下载 $fname ..."
  curl -L --connect-timeout 8 --max-time 30 -sf -o "$fname" "${urls[$i]}"
  if [ $? -eq 0 ] && [ -s "$fname" ]; then
    sz=$(ls -lh "$fname" | awk '{print $5}')
    echo "  ✅ $sz"
    count=$((count+1))
  else
    echo "  ❌ 失败，跳过"
    rm -f "$fname"
  fi
done
echo ""
echo "成功下载: $count 个视频"
