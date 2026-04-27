FROM golang:1.25-alpine AS builder

RUN apk --no-cache add git

WORKDIR /src
RUN git clone --depth 1 https://github.com/redhat-et/docsclaw.git .
RUN CGO_ENABLED=0 GOOS=linux go build -o /docsclaw ./cmd/docsclaw

FROM alpine:3.23

RUN apk --no-cache add ca-certificates curl && \
    addgroup -S docsclaw && adduser -S docsclaw -G docsclaw

WORKDIR /app
COPY --from=builder /docsclaw /app/docsclaw
COPY config/ /config/agent/

USER docsclaw

EXPOSE 8000 8100

ENTRYPOINT ["/app/docsclaw"]
CMD ["serve", "--config-dir", "/config/agent", "--listen-plain-http"]
