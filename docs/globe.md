---
layout: page
title: The globe
body_class: globe-page
description: What the globe of the home page shows, how it is made, and the data and work it builds on.
---

The globe of the home page draws the land as dots and, as orange spikes, the latest edits to
[OpenStreetMap](https://www.openstreetmap.org/): the changesets closed by mappers anywhere in
the last 20 minutes, as many as they are, each taller the more it changed. Arcs join them in the order they were made; the
orange ring marks the Isola Tiberina, in Rome, where the map of the 2024 prototype began. Drag
the globe, or use the arrow keys, to turn it.

**The edits** come with the site, read when it is built, then again every 19 minutes while
the globe is in view: from the server of this site, which reads the
[replication of changesets](https://planet.openstreetmap.org/replication/changesets/) once for
every visitor, or, where there is none, by your browser from the replication itself (served by
OpenStreetMap and a mirror on Amazon S3); never from the editing API, which is not for reading
([usage policy](https://operations.osmfoundation.org/policies/api/)). Of each changeset only
the centre (to about 1 km), the number of changes and the time are kept, never the mapper.

**The technique** is that of
[How we built the GitHub globe](https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/)
by Tobias Ahlin (GitHub, 2020), rebuilt on [three.js](https://threejs.org/): GitHub did not
publish its code, and none of it is used here. Where that globe draws pull requests, this one
draws edits to the map of the world. The code is in `src/globe/` of the
[repository]({{ site.github.repo }}).

**Data and licences**: edits &copy; [OpenStreetMap contributors](https://www.openstreetmap.org/copyright),
[ODbL](https://opendatacommons.org/licenses/odbl/1-0/); land from
[Natural Earth](https://www.naturalearthdata.com/), public domain; three.js, MIT licence
([text]({{ '/assets/bundle/three.LICENSE.txt' | relative_url }})).
