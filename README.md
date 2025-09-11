# excalidraw-stack

> Selfhostable excalidraw with collaboration, storage, libraries, & more soon ™️

## What's working?

- Excalidraw (the app itself)
- Live collaboration
- Storage + link sharing
- Libraries

## What's missing?

- Custom implementation of the AI server
- Custom frontend for the Exccalidraw+ UI (this is a larger thing as it requires us to add auth etc) + UI for loading user owned files from the storage db.
- Ideally not just steal their firebase cfg lmao

## Steps to get it workin:

- Fork the repo

- Install the required packages etc for the gen script with `bun install`

- Run the script with `bun start` - it will ask you a few questions, and then prepare everything for you, and in the end generate a docker-compose.yml file for you.

- If not deploying on something that adds caddy/traefik labels for you, then you ofc have to add these yourself.

- Deploy the whole thing & point it to the docker-compose.yml file :3

- Profit (?)

## Todo:

- Make patching more effecient & "smarter" so we can in the future just clone the latest from excalidraw/excalidraw, patch it, and then it just ✨ works ✨ - without having someone manually look at everything to make sure it works.

### This couldn't have been done without the amazing work of:

- https://github.com/excalidraw <-- Excalidraw, excalidraw-room, excalidraw-libraries
- https://github.com/alswl <-- Original idea, v1 storage server
- https://github.com/Radvendii <-- Their codebase was a massive help with figgureing everything out
