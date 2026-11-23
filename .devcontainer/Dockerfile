# Image of the Codespace / devcontainer: Ubuntu 24.04 with Python 3 (the harness scripts and
# the git hooks use it, standard library only). Node, GitHub CLI and Claude Code come from the
# features in devcontainer.json; post-create.sh installs the dependencies of the project.
#
# System packages of a repository go in the EXTRA_PACKAGES build argument of
# devcontainer.json (Debian names, space separated). A tool that needs more than a package
# gets an install script in scripts/, copied and run here and run by the workflows too, so
# that the devcontainer and CI install the same version (the build context is the
# repository root).
FROM mcr.microsoft.com/devcontainers/base:noble

ARG DEBIAN_FRONTEND=noninteractive
ARG EXTRA_PACKAGES=""

RUN apt-get update -qq \
 && apt-get install -y -qq --no-install-recommends \
      python3 python3-venv python3-pip ${EXTRA_PACKAGES} \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# TEMPLATE: the tools of this repository, for instance
#   COPY scripts/install-<tool>.sh /tmp/install/
#   RUN bash /tmp/install/install-<tool>.sh && rm -rf /tmp/install
