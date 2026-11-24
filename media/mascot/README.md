# The mascot of the logo, in 3D

![The mascot, as Meshy rendered it](mascot-thumbnail.png)

The mascot of the logo (`docs/assets/images/theplanet.png`) as a 3D model: glTF 2.0 binaries
of 30,541 triangles with their own texture (2048 by 2048 JPEG). All five files that Meshy
made on 2026-11-24 are kept, since Meshy deletes them after 3 days:

| File | What it is | Size | What it may serve |
|---|---|---|---|
| `mascot-walking.glb` | Mesh, skeleton of 24 bones, a walk of 1.07 s in place | 5.4 MB | The mascot walking, as it is (an easter egg of thegame) |
| `mascot-running.glb` | The same, with a run of 0.67 s | 5.4 MB | The mascot running; its clip can drive the walking model too, since the skeleton is the same |
| `mascot-rigged.glb` | Mesh and skeleton in the rest pose, no animation of its own | 5.4 MB | The base for other animations: the [animation library of Meshy](https://docs.meshy.ai/en/api/animation) (3 credits each, from the rigging task while Meshy keeps it, then from this file) or an animation tool such as Blender |
| `mascot-base.glb` | Mesh only, no skeleton (`mascot.glb` in `provenance.json`) | 4.3 MB | Another rig (in Blender, or a service of auto-rigging), still images, 3D printing |
| `mascot-thumbnail.png` | The preview rendered by Meshy | 0.2 MB | This README |

- **Made by** the API of [Meshy](https://docs.meshy.ai/en/api/image-to-3d) on 2026-11-24, with
  `scripts/meshy.py` (`npm run mascot:generate`): Image to 3D from the logo, then rigging. The
  tasks, the parameters and the credits are in `provenance.json`.
- **Owned by** the organization: on a paid plan of Meshy the customer owns the output
  ([terms of use](https://www.meshy.ai/terms-of-use), 3.2).
- **Not used by the site.** The owner chose on 2026-11-24 to keep the globe in the style of
  GitHub on the home page, and to keep this model for another use, for instance an easter egg
  of [thegame](https://github.com/theplanet-earth/thegame). This folder is outside `docs/`, so
  the site does not publish it.
- **What to know before using them**: the model kept the walking pose of the logo although the
  script asked for a T-pose; the skeleton is in centimetres under an `Armature` scaled 0.01,
  and the mesh is turned against it, so a loader should work with the skinned positions, as
  three.js and Blender do. The face points towards +Z, as rigging requires.
