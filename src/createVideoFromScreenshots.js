const execSync = require("child_process").execSync;

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    "not enough arguments: yarn run generate-audio audio-file length"
  );
  process.exit(1);
}

const audioFile = `${process.cwd()}/${args[0]}`;

(async () => {
  await execSync(
    `ffmpeg -y -framerate 30 -i screenshots/SS-%05d.png -i ${audioFile} -shortest -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p out.mp4`
  );
})();
