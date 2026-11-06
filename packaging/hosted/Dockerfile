# Container image for a downloaded OpenBridge hosted release (the files next to this one).
# The site is already built, so this is a small static image with no Node.js.
#
#   docker build -t openbridge .
#   docker run --rm -p 127.0.0.1:8080:8080 openbridge
#
# The image listens on 8080 inside the container. Publish it to 127.0.0.1 as above and put an
# HTTPS reverse proxy in front for public use.

FROM nginxinc/nginx-unprivileged:1.31-alpine

COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
