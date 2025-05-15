default: boot-backend

boot-backend backendImage='ghcr.io/jdav-freiburg/depot-manager-backend:main':
    @echo "Booting local isolated backend"
    docker compose -f local-backend-stack/docker-compose.yaml down -v
    BACKEND_IMAGE={{backendImage}} docker compose -f local-backend-stack/docker-compose.yaml pull --ignore-pull-failures
    BACKEND_IMAGE={{backendImage}} docker compose -f local-backend-stack/docker-compose.yaml up --detach
