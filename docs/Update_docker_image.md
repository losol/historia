# Update Docker image

This document describes how to update the Docker image for the [Docker image](https://hub.docker.com/r/losolio/historia)

## Build the image

```bash
docker build . --tag losolio/historia
```

Test the container by running

```bash
docker run --rm -it  -p 8000:8000/tcp losolio/historia:latest
```

## Push the image

After logging in with `docker login`, push the image to the Docker Hub:

```bash
docker push historia:latest
```
