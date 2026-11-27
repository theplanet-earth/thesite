---
layout: page
nav_order: 3
title: Privacy
description: What this site does with the data of its visitors, under the GDPR and the Italian rules on cookies.
---

<!-- The privacy notice of the site (the owner, 2026-11-25), under Article 13 of the GDPR. Every
     statement about Cloudflare, GitHub or OpenStreetMap links to the page that says it; when
     the site starts to load or read something else, this page changes in the same pull
     request (CLAUDE.md, Section 7), and so does its date below. scripts/check-site.py fails on
     any resource of another host, which this page would then have to name. -->

**In short**: this site sets no cookies, stores nothing in your browser, and has no
analytics, advertising, tracking, forms or accounts. It loads its pages, fonts, styles and
scripts from itself; only the map of the page Map comes from OpenStreetMap. What is left is
what every website does: the servers that deliver it receive the address of your device (the
IP address) with every request.

## Who is responsible

The controller of the data, under the
[General Data Protection Regulation](https://eur-lex.europa.eu/eli/reg/2016/679/oj) (GDPR), is
{{ site.author }}, who runs this site for the project theplanet.earth: at
[theplanet.observer](https://theplanet.observer/), and its preview at
[theplanet.wtf](https://theplanet.wtf/). Write to
[privacy@theplanet.dev](mailto:privacy@theplanet.dev) for anything about this page or your
data.

## What happens when you visit

**At theplanet.observer**, the site is served by [Cloudflare](https://www.cloudflare.com/),
which receives your IP address and the details of each request (the page, the time, and what
your browser sends with it, such as its name and version), to deliver the site and protect it
from attacks. Cloudflare does this on behalf of the controller, as its processor
([data processing addendum](https://www.cloudflare.com/cloudflare-customer-dpa/), 2.3). While
the globe of the home page is on screen, your browser asks the same server for the latest
edits to OpenStreetMap every 19 minutes; if that server does not answer the first time, your
browser reads them from OpenStreetMap itself, as on the preview. A browser that fails to reach
the site may send Cloudflare a report of the error
([Network Error Logging](https://developers.cloudflare.com/network-error-logging/)).

**At theplanet.wtf**, the preview, the site is served by
[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection):
"the visitor's IP address is logged and stored for security purposes", by GitHub as a
controller of its own, under its
[privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
While the globe is on screen, your browser reads the latest edits every 19 minutes from the
[replication of OpenStreetMap](https://planet.openstreetmap.org/replication/changesets/),
which sends it on to a copy on Amazon S3 in Frankfurt: the OpenStreetMap Foundation
([privacy policy](https://osmfoundation.org/wiki/Privacy_Policy)) and Amazon Web Services
([privacy notice](https://aws.amazon.com/privacy/)) receive your IP address and the details of
those requests. Your browser only downloads public files; it sends nothing else.

**The map** of the page Map is the map of
[OpenStreetMap](https://www.openstreetmap.org/), on both sites: while it is shown, your
browser asks `tile.openstreetmap.org` for its images (the tiles) of the places on screen,
each time you move or zoom it. The home page asks nothing of it until you open the map. The
OpenStreetMap Foundation receives your IP address, the details of those requests (what your
browser sends with them, such as its name and version) and, as its
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/) asks, the address of
this site (only the site, never the page), as a controller of its own, under its
[privacy policy](https://osmfoundation.org/wiki/Privacy_Policy), which says that the tiles
come from "a global network of cache servers" chosen by the operation of a content
distribution network at the time of the request, and does not name that network.

**Links** to other sites (GitHub, OpenStreetMap, and the sources this site cites) are followed
only when you click them; that site's own policy then applies.

**The controller keeps no record of the visits.** Cloudflare shows the controller statistics
of the traffic of theplanet.observer and the details of the requests its security features
act on; nothing of it is copied or kept elsewhere.

## Cookies and similar technologies

None: no cookies, no local storage, no fingerprinting, no tracking pixels. The notice that
opens at the start of a visit, and points here, stores nothing either: it does not remember
that you closed it, so it opens again at your next visit, though not on the other pages of
the same visit. For this reason the site asks for no consent: under the
[guidelines of the Italian Data Protection Authority](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)
of 10 June 2021, consent is needed only for cookies and trackers that are not technical, and
this site uses no cookie or tracker of any kind.

## Legal basis

The legitimate interest of the controller in delivering the site and keeping it secure and
available (Article 6(1)(f) of the GDPR): no web page reaches a browser without its IP address.
Giving these data is not an obligation, but without them the site cannot be shown. No
decision is taken about you by automated means, and no profile is made.

## Outside the European Union

Cloudflare and GitHub are companies of the United States, certified under the EU-U.S. Data
Privacy Framework ([Cloudflare](https://www.cloudflare.com/privacypolicy/), section 7;
[GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)),
which the European Commission found adequate on 10 July 2023
([Decision (EU) 2023/1795](https://eur-lex.europa.eu/eli/dec_impl/2023/1795/oj)); both also
rely on the standard contractual clauses of the Commission. The OpenStreetMap Foundation keeps
such data in the United Kingdom and the Netherlands; the United Kingdom has an adequacy
decision of the Commission until 27 December 2031
([press release](https://ec.europa.eu/commission/presscorner/detail/en/ip_25_3059)). Its
privacy policy leaves out of that statement the data of the requests for tiles, and says
neither where the network that serves them is, nor where their records are kept.

## How long

The controller keeps nothing. Cloudflare, GitHub and the OpenStreetMap Foundation keep their
logs for the time their policies state; none of them gives a fixed period for the logs of the
requests described above.

## Your rights

You may ask the controller for access to your data, their rectification or erasure, the
restriction of their processing, and object to it (Articles 15 to 21 of the GDPR), at
[privacy@theplanet.dev](mailto:privacy@theplanet.dev). The controller holds no data that
identify a visitor, so most of these requests can only be answered by saying so
(Article 11); a request about the logs of Cloudflare is followed up with Cloudflare. You may
also lodge a complaint with the
[Garante per la protezione dei dati personali](https://www.garanteprivacy.it/), or with the
authority of the country where you live or work (Article 77).

## Changes

This page changes with the site, and says so before the site starts to use anything it does
not describe. Last changed on 26 November 2026; every change is in the
[history of this page]({{ site.github.repo }}/commits/master/docs/privacy.md).
