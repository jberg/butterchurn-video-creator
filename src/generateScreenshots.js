const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    "not enough arguments: yarn run generate-screenshots preset-file audio-analysis-file length"
  );
  process.exit(1);
}

const dir = "./tmp/screenshots";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
} else {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlinkSync(path.join(dir, file), err => {
        if (err) throw err;
      });
    }
  });
}

let presetName = path.basename(args[0]);
presetName = presetName.substring(0, presetName.length - 5);

const preset = JSON.parse(fs.readFileSync(args[0]).toString());

let audioAnalysisFile;
if (args.length > 1) {
  audioAnalysisFile = args[1];
} else {
  audioAnalysisFile = `${process.cwd()}/tmp/audioAnalysisData.json`;
}
const audioAnalysis = JSON.parse(fs.readFileSync(audioAnalysisFile).toString());

let frameCount;
if (args.length > 2) {
  frameCount = Math.min(args[2], audioAnalysis.length);
} else {
  frameCount = audioAnalysis.length;
}

(async () => {
  const width = 800;
  const height = 600;
  const framerate = 30;
  const frametime = 1 / framerate;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", err => console.log("PAGE ERROR: " + err.toString()));
  const html = `
  <!DOCTYPE html>
    <head>
      <script type="text/javascript" src="https://unpkg.com/lodash"></script>
      <script type="text/javascript" src="https://unpkg.com/butterchurn"></script>
      <script
        src="https://code.jquery.com/jquery-3.1.1.min.js"
        integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8="
        crossorigin="anonymous"></script>

      <style>
        #canvas:fullscreen {
          width: 100%;
          height: 100%;
        }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/normalize.css/normalize.css" />

      <script>
        $(function() {
          const canvas = document.getElementById('canvas');
          const visualizer = butterchurn.createVisualizer(null, canvas , {
            width: ${width},
            height: ${height},
            meshWidth: 64,
            meshHeight: 48,
            pixelRatio: 1,
            textureRatio: 2,
          });

          window.loadPreset = (preset) => {
            visualizer.loadPreset(preset, 0);
          }

          window.launchSongTitleAnim = (text) => {
            visualizer.launchSongTitleAnim(text);
          }

          window.render = (opts) => {
            visualizer.render(opts);
          }
        });
      </script>
    </head>
    <body>
      <div>
        <canvas id='canvas' width='${width}' height='${height}'></canvas>
      </div>
    </body>
  </html>`;
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`data:text/html;charset=UTF-8,${html}`);

  await page.evaluate(preset => window.loadPreset(preset), preset);

  await page.evaluate(text => window.launchSongTitleAnim(text), presetName);

  let totalTime = 0;
  let expectedTime = 0;
  for (let i = 0; i < frameCount; i++) {
    const audioData = audioAnalysis[i];

    let elapsedTime;
    if (i === 0) {
      elapsedTime = audioData.time;
    } else {
      elapsedTime = audioData.time - audioAnalysis[i - 1].time;
    }

    const renderOpts = {
      elapsedTime,
      audioLevels: {
        timeByteArray: audioData.timeByteArray,
        timeByteArrayL: audioData.timeByteArrayL,
        timeByteArrayR: audioData.timeByteArrayR
      }
    };

    totalTime += elapsedTime;
    expectedTime += frametime;

    // Calcualte rendering time and screenshot time
    const start = Date.now();

    await page.evaluate(renderOpts => {
      window.render(renderOpts);
    }, renderOpts);

    const mid = Date.now();

    await page.screenshot({
      path: `tmp/screenshots/SS-${(i + "").padStart(5, 0)}.png`
    });

    const end = Date.now();
    console.log(
      `Frame ${i + 1}, Render Time: ${(mid - start) /
        1000}, Screenshot Time: ${(end - mid) /
        1000}, Time Desync: ${totalTime - expectedTime}`
    );
  }

  await browser.close();
})();
