for i in *; do
  f=${i%.*}
  sum=$(echo -n "$f" | md5)
  echo -- "$f" "${sum%% *}.${i##*.}"
  # mv -- "$i" "${sum%% *}.${i##*.}"
done
