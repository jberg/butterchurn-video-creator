# Butterchurn Video Creator

Create videos of Milkdrop presets using Butterchurn

Used for making the videos for [MilkDrop Presets Bot](https://twitter.com/MilkDropPresets)

## Usage

### Installation

```bash
# Clone this repository
git clone https://github.com/jberg/butterchurn-video-creator
# Go into the repository
cd butterchurn-video-creator
# Install dependencies
yarn install
```

### Create a video

```bash
# Generate an audio analysis file
yarn run generate-audio audio_file_path length_in_ms
# Generate screenshots from preset and audio analysis
yarn run generate-screenshots preset_file_path.json [audio_analysis_file] [length_in_frames]
# Create a video from screenshots and audio
yarn run create-video-from-screenshots audio_file_path
```

JSON formatted presets can be found in the [butterchurn-presets](https://github.com/jberg/butterchurn-presets) repository

[FFmpeg](https://github.com/FFmpeg/FFmpeg) is required for the final step, or you can stich the PNGs together using another method

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
