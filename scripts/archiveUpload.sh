MD_IDX=0
for i in *.png(On); do
  MD_IDX=$(($MD_IDX+1))
  if [ "$MD_IDX" -lt 0 ]; then
    continue
  fi

  echo "Processing $MD_IDX -- $i"

  f=${i%.*}
  id_partial=$(echo $f | gsed 's/{/_/g' | gsed 's/}/_/g' | gsed 's/ - /_/g' | gsed 's/(/_/g' | gsed 's/)/_/g' | gsed 's/ /_/g' | gsed "s/'//g" | gsed 's/__/_/g' | gsed 's/__/_/g' | gsed 's/\[/_/g' | gsed 's/\]/_/g' | gsed 's/_\././g' | gsed 's/__/_/g' | gsed 's/,//g' | gsed 's/+//g' | gsed 's/!//g' | gsed 's/#//g' | gsed "s/'//g" | gsed 's/&//g' | gsed 's/!//g' | gsed 's/,//g' | gsed 's/@//g')
  id_partial2=$(echo $id_partial | gsed 's/\.iso$//g' | gsed 's/_images.zip//g' | gsed 's/.cbr//g' | gsed "s/'//g" | gsed 's/.cbz//g' | gsed 's/.pdf//g' | gsed 's/.djvu//g' | gsed 's/\.mov//g' | gsed 's/\.mp4//g' | gsed 's/.wmv//g' | gsed 's/__/_/g' | gsed 's/\.avi//g' | gsed 's/\.divx//g' | gcut -c 1-80 | gsed 's/.cbz//g' | gsed 's/.cbr//g' | gsed 's/\.atr//g' | gsed 's/ /_/g' | gsed 's/.mp3//g' | gsed 's/.mpg//g' | gsed 's/(//g' | gsed 's/)//g' | gsed 's/.m4v//g' | gsed 's/\.bin//g' | gsed 's/\.dsk//g' | gsed 's/,//g' | gsed 's/\.milk//g' | gsed 's/.vob//g' | gsed 's/_*$//g')
  id="md_$id_partial2"
  
  meta=$(ia metadata $id)

  exists=$(echo $meta | jq 'length')
  if [ "$exists" -eq 0 ]; then
    echo "SKIPPING $MD_IDX - $id, $exists --- empty preset"
    continue
  fi

  presetcount=$(echo $meta | jq '.files | map(select(.name | endswith(".milk"))) | length')
  if [ "$presetcount" -gt 1 ]; then
    echo "SKIPPING $MD_IDX - $id, too many presets"
    continue
  fi

  imgcount=$(echo $meta | jq '.files | map(select(.name | endswith(".png"))) | length')
  jsoncount=$(echo $meta | jq '.files | map(select(.name | endswith(".json"))) | length')
  if [ "$imgcount" -gt 0 ] && [ "$jsoncount" -gt 0 ]; then
    echo "ALREADY LOADED IMAGE AND PRESET $MD_IDX - $id"
    continue
  fi

  # echo "$MD_IDX" ---- "$id" ---- "$presetcount" ----- "$imgcount"
  res1=$(ia upload $id $i -r preview.png --retries 10)
  res2=$(ia upload $id ../converted\ megapresets/$f.json -r $id.json --retries 10)
  res3=$(ia metadata $id --modify="webamp:https://webamp.org/?butterchurnPresetUrl=https://archive.org/cors/$id/$id.json")
done
