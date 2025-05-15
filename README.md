<a href="https://cloud.docker.com/repository/docker/voegtlel/depot-manager-frontend/builds">
  <img src="https://img.shields.io/docker/cloud/build/voegtlel/depot-manager-frontend.svg" alt="Docker build status" />
</a>
<img src="https://img.shields.io/github/license/voegtlel/depot-manager-frontend.svg" alt="License" />

# Client for Depot Manager

This is the frontend for [depot-manager-backend](https://github.com/voegtlel/depot-manager-backend).

It is build with

![iDesk2 Reloaded logo][angular-logo]

## Run locally

### Download dependencies

``yarn install --immutable --immutable-cache --check-cache``

### Serve app

``yarn run start:offline``

### Backend

Currently getting the whole stack running (including proprietary OAUTH2 service) is complex.

For this we have prepared a local "offline" / "no-auth" mode in the backend.
This can easily set up with a docker-compose.

You need [Just](https://just.systems/man/en/).

#### Boot backend

``just``

🤔 checkout [docker-compose](local-backend-stack/docker-compose.yaml) & [justfile](justfile) if you want to know how this works.

## [Published images](https://github.com/jdav-freiburg/depot-manager-backend/pkgs/container/depot-manager-frontend)

[angular-logo]: doc/angular.svg "Angular Logo"
