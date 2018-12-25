const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const args = process.argv.slice(2);
if (args.length < 4) {
  console.log(
    "not enough arguments: yarn run generate-preview-screenshot preset-file audio-analysis-file frames output-dir"
  );
  process.exit(1);
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

const frameCount = Math.min(args[2], audioAnalysis.length);
const outputDir = args[3];

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

    await page.evaluate(renderOpts => {
      window.render(renderOpts);
    }, renderOpts);
  }

  await page.screenshot({
    path: `${outputDir}/${presetName}.png`
  });

  await browser.close();
})();
