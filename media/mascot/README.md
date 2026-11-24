# The mascot of the logo, in 3D

![The mascot, as Meshy rendered it](mascot-thumbnail.png)

`mascot-walking.glb` is the mascot of the logo (`docs/assets/images/theplanet.png`) as a 3D
model: a glTF 2.0 binary of 30,541 triangles with its own texture (2048 by 2048 JPEG), a
skeleton of 24 bones and a walking clip of 1.07 s that walks in place. It is 5.4 MB.

- **Made by** the API of [Meshy](https://docs.meshy.ai/en/api/image-to-3d) on 2026-11-24, with
  `scripts/meshy.py` (`npm run mascot:generate`): Image to 3D from the logo, then rigging. The
  tasks, the parameters and the credits are in `provenance.json`.
- **Owned by** the organization: on a paid plan of Meshy the customer owns the output
  ([terms of use](https://www.meshy.ai/terms-of-use), 3.2).
- **Not used by the site.** The owner chose on 2026-11-24 to keep the globe in the style of
  GitHub on the home page, and to keep this model for another use, for instance an easter egg
  of [thegame](https://github.com/theplanet-earth/thegame). This folder is outside `docs/`, so
  the site does not publish it.
- **What to know before using it**: the model kept the walking pose of the logo although the
  script asked for a T-pose; its skeleton is in centimetres under an `Armature` scaled 0.01,
  and the mesh is turned against it, so a loader should work with the skinned positions, as
  three.js and Blender do. The face points towards +Z, as rigging requires.
