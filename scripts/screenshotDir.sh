for file in ~/Desktop/MASTERPRESETS/converted\ megapresets/*.json(On); do
  base=$(basename $file)
  if [ ! -f ~/Desktop/MASTERPRESETS/megapresets\ preview/${base: : -5}.png ]; then
    yarn run generate-preview-screenshot $file tmp/audioAnalysisData.json 120 ~/Desktop/MASTERPRESETS/megapresets\ preview
    echo "Finished $base"
  else
    echo "Skipping $base"
  fi
done
