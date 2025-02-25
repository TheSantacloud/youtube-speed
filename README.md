# YouTube Speed

A simple extension to control YouTube playback rate with keybinds, and save channel specific
speeds for later use.

I created this addon because for some reason YouTube didn't incorporate keybindings to control playback speed.
I've been using it for a long while, and it's an inseperable part of my browsing experience. So might as well share.

## How to use

### Features

- **Default Playback Rate** - you can set your default playback rate to a specific multiplier (default x1.5)
- **Keybinds** - basic keybinds to control the playback speed and save them
- **Save playback for specific channels** - save a playback speed for a specific channel, can be browsed in the popup

### Default keybinds

In MacOS, `Alt` will be treated as `Option`

- `Alt+Shift+S`: Open the YouTube speed extension
- `Alt+S`: Save playback rate for current channel
- `Alt+J`: Increase playback rate
- `Alt+K`: Decrease playback rate

### Screenshots

![popup](assets/popup.png?raw=true "Popup")

![playback-rate](assets/playback-rate.png?raw=true "Change playback rate")

![saved-new](assets/saved-new.png?raw=true "Save new playback rate")

## Development

### TODO:

- [X] Set custom default rate for specific channels
- [X] UX friendly way to show the current playback rate
- [X] Search bar
- [X] Show the correct playback speed in the Google Settings pane ui
- [X] Set default rate for all videos
- [X] Auto-skip commercials when available
- [X] When switching videos within the same tab, adjust speed to the current channel
- [X] Speed up non-skippable ads
- [X] Create proper README.md
- [ ] Sorting based on clicking the column header
- [ ] Add customizable max speed input
- [ ] Publish to Chrome extension store
- [ ] Publish to Firefox addon store (and register as addon)

### Bugs:

- [X] After an ad playback resets to original
- [X] When a video starts with an ad - skip it too
- [X] When the video is opened in a new tab, youtube speed doesnt load the content script (requires refresh)
- [X] Maintain playback ratio when leaving and returning to tab
- [X] Save channel not supported in Firefox
- [ ] Playlist next video doesnt adjust playback rate
- [ ] Navigating to YouTube page from history (Cmd+Shift+T) doesn't change playback rate
- [ ] Set rate limit under default doesn't apply
