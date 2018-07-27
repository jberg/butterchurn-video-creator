const fs = require("fs");
const puppeteer = require("puppeteer");

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    "not enough arguments: yarn run generate-audio audio-file length"
  );
  process.exit(1);
}

const audioFile = `${process.cwd()}/${args[0]}`;
let audioTime;
if (args.length > 1) {
  audioTime = args[1];
} else {
  audioTime = 10000;
}

(async () => {
  const framerate = 30;
  const frametime = 1 / framerate;
  const audioAnalysisData = [];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG: ", msg.text()));
  page.on("pageerror", err => console.log("PAGE ERROR: " + err.toString()));

  let audioLoopTimeout;
  let expectedTime = 0;
  async function audioLoop() {
    const audioData = await page.evaluate(() => window.analyzeAudio());
    audioAnalysisData.push(audioData);

    const totalTime = audioData.time;
    expectedTime += frametime;

    const nextFrameTime = expectedTime - totalTime + frametime; // account for setTimeout innacuracy

    audioLoopTimeout = setTimeout(
      () => audioLoop(),
      1000 * (expectedTime - totalTime + frametime)
    );
  }

  function audioFileReadFinished() {
    audioLoop();

    setTimeout(async () => {
      clearTimeout(audioLoopTimeout);

      fs.writeFileSync(
        "./audioAnalysisData.json",
        JSON.stringify(audioAnalysisData)
      );

      await browser.close();
    }, audioTime);
  }

  await page.exposeFunction("audioFileReadFinished", () =>
    audioFileReadFinished()
  );
  const html = `
  <!DOCTYPE html>
    <head>
      <script
        src="https://code.jquery.com/jquery-3.1.1.min.js"
        integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8="
        crossorigin="anonymous"></script>

      <script>
        let audioContext = new AudioContext();
        let analyser, analyserL, analyserR;
        let audioStart;

        window.analyzeAudio = () => {
          const timeByteArray = new Uint8Array(1024);
          const timeByteArrayL = new Uint8Array(1024);
          const timeByteArrayR = new Uint8Array(1024);

          analyser.getByteTimeDomainData(timeByteArray);
          analyserL.getByteTimeDomainData(timeByteArrayL);
          analyserR.getByteTimeDomainData(timeByteArrayR);

          return {
            time: audioContext.currentTime - audioStart,
            timeByteArray: Array.from(timeByteArray),
            timeByteArrayL: Array.from(timeByteArrayL),
            timeByteArrayR: Array.from(timeByteArrayR)
          };
        }

        $(function() {
          const input = document.getElementById('input');

          audioContext.resume();

          input.onchange = () => {
            let file = input.files[0];

            let reader = new FileReader();
            reader.onload = (event) => {
              audioContext.decodeAudioData(
                event.target.result,
                (buffer) => {
                  let sourceNode = audioContext.createBufferSource();
                  sourceNode.buffer = buffer;

                  analyser = audioContext.createAnalyser();
                  analyser.smoothingTimeConstant = 0.0;
                  analyser.fftSize = 1024;

                  analyserL = audioContext.createAnalyser();
                  analyserL.smoothingTimeConstant = 0.0;
                  analyserL.fftSize = 1024;

                  analyserR = audioContext.createAnalyser();
                  analyserR.smoothingTimeConstant = 0.0;
                  analyserR.fftSize = 1024;

                  const splitter = audioContext.createChannelSplitter(2);

                  sourceNode.connect(analyser);
                  sourceNode.connect(splitter);
                  splitter.connect(analyserL, 0);
                  splitter.connect(analyserR, 1);

                  audioStart = audioContext.currentTime;
                  sourceNode.start(0);
                  window.audioFileReadFinished();
                }
              );
            };

            reader.readAsArrayBuffer(file);
          }

        });
      </script>
    </head>
    <body>
      <input id="input" type="file" accept="audio/*" />
    </body>
  </html>`;
  await page.goto(`data:text/html;charset=UTF-8,${html}`);

  const input = await page.$("#input");
  await input.uploadFile(audioFile);
})();
