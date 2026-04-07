FROM alpine:latest

ARG PB_VERSION=0.36.7
ARG TARGETARCH

RUN apk add --no-cache unzip ca-certificates wget

RUN case "${TARGETARCH}" in \
    amd64|arm64) pb_arch="${TARGETARCH}" ;; \
    *) echo "Unsupported target architecture: ${TARGETARCH}" >&2; exit 1 ;; \
  esac \
  && wget -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${pb_arch}.zip" \
  && unzip /tmp/pb.zip -d /pb/ \
  && chmod +x /pb/pocketbase \
  && rm /tmp/pb.zip \
  && mkdir -p /pb/pb_migrations /pb/pb_hooks /pb/pb_public

WORKDIR /pb

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY pb_public /pb/pb_public

EXPOSE 8080

CMD ["sh", "-c", "./pocketbase migrate up --dir=/pb_data --migrationsDir=/pb/pb_migrations && if [ -n \"$PB_SUPERUSER_EMAIL\" ] && [ -n \"$PB_SUPERUSER_PASSWORD\" ]; then ./pocketbase superuser upsert \"$PB_SUPERUSER_EMAIL\" \"$PB_SUPERUSER_PASSWORD\" --dir=/pb_data --migrationsDir=/pb/pb_migrations; fi && exec ./pocketbase serve --http=0.0.0.0:${PORT:-8080} --dir=/pb_data --hooksDir=/pb/pb_hooks --migrationsDir=/pb/pb_migrations --publicDir=/pb/pb_public --automigrate=false"]
