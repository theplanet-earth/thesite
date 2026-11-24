---
layout: page
title: About
description: What this site is, what its globe shows, and the work it is made of.
---

This is the project site of [theplanet.earth](https://github.com/theplanet-earth), an
organization on GitHub. Its source is the public repository
[theplanet-earth/thesite]({{ site.github.repo }}).

## The globe

The home page shows the Earth as a globe of dots, built on the techniques that Tobias Ahlin
describes in
[How we built the GitHub globe](https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/)
(GitHub, 2020). Where the GitHub globe draws pull requests being opened and merged, this one
draws the latest edits to [OpenStreetMap](https://www.openstreetmap.org/): each orange spike
is an edit, taller the more it changed, and the arcs join the edits in the order they were
made. The edits are read when the site is built, from the
[minutely replication of changesets](https://planet.openstreetmap.org/replication/changesets/);
the site keeps only where, how much and when, never who. The orange ring marks the place
where the map of the 2024 prototype of this site began: the Isola Tiberina, in Rome.

Drag the globe, or focus it and use the arrow keys, to turn it.

## Made with

- [three.js](https://threejs.org/), MIT licence, for the globe;
- [Natural Earth](https://www.naturalearthdata.com/), public domain, for the land;
- [OpenStreetMap](https://www.openstreetmap.org/copyright), data © OpenStreetMap
  contributors, ODbL, for the edits;
- [Jekyll](https://jekyllrb.com/), and the [Hyde](https://github.com/poole/hyde) theme on
  [Poole](https://github.com/poole/poole) by Mark Otto, MIT licence
  ([licence]({{ '/public/LICENSE.md' | relative_url }})).
