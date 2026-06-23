#!/usr/bin/env bash
# Docker install/start helpers for Mac and Linux (official Docker sources).

DOCKER_WAIT_TIMEOUT="${DOCKER_WAIT_TIMEOUT:-300}"
DOCKER_DESKTOP_MAC_URL="https://docs.docker.com/desktop/setup/install/mac-install/"

test_docker_cli_installed() {
  command -v docker >/dev/null 2>&1
}

test_docker_compose_available() {
  docker compose version >/dev/null 2>&1
}

test_docker_daemon_running() {
  test_docker_cli_installed && docker info >/dev/null 2>&1
}

show_docker_not_ready_help() {
  echo "" >&2
  echo "Docker is not running yet." >&2
  echo "If you just installed Docker Desktop:" >&2
  echo "  1. Start Docker Desktop from Applications" >&2
  echo "  2. Wait until it shows 'Engine running'" >&2
  echo "  3. Reboot if prompted, then run setup again" >&2
  echo "" >&2
  echo "Then run:" >&2
  echo "  ./scripts/setup.sh" >&2
}

wait_for_docker_daemon() {
  local timeout="${1:-$DOCKER_WAIT_TIMEOUT}"
  local elapsed=0

  echo "Waiting for Docker engine (timeout ${timeout}s)..."
  while ! test_docker_daemon_running; do
    if (( elapsed >= timeout )); then
      return 1
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    if (( elapsed % 30 == 0 )); then
      echo "  Still waiting... (${elapsed}s)"
    fi
  done
  echo "Docker engine is running."
  return 0
}

start_docker_desktop_mac() {
  if [[ -d "/Applications/Docker.app" ]]; then
    echo "Starting Docker Desktop..."
    open -a Docker
    return 0
  fi
  return 1
}

start_docker_service_linux() {
  if command -v systemctl >/dev/null 2>&1; then
    echo "Starting Docker service..."
    sudo systemctl start docker 2>/dev/null || true
  elif command -v service >/dev/null 2>&1; then
    echo "Starting Docker service..."
    sudo service docker start 2>/dev/null || true
  fi
}

install_docker_mac() {
  if command -v brew >/dev/null 2>&1; then
    echo ">>> Docker is not installed. Installing via Homebrew (docker-desktop cask)..."
    brew install --cask docker
    return 0
  fi

  echo "error: Docker is not installed and Homebrew was not found." >&2
  echo "Install Docker Desktop manually: ${DOCKER_DESKTOP_MAC_URL}" >&2
  exit 1
}

install_docker_linux() {
  echo ">>> Docker is not installed. Running official get.docker.com install script..."
  echo "    (sudo password may be required)"
  local tmp
  tmp="$(mktemp)"
  curl -fsSL https://get.docker.com -o "$tmp"
  sudo sh "$tmp"
  rm -f "$tmp"

  if id -nG "$USER" 2>/dev/null | grep -qw docker; then
    :
  else
    echo "Note: you may need to log out and back in (or run: newgrp docker) after install." >&2
  fi
}

install_docker() {
  case "$(uname -s)" in
    Darwin)
      install_docker_mac
      ;;
    Linux)
      install_docker_linux
      ;;
    *)
      echo "error: unsupported OS for automatic Docker install: $(uname -s)" >&2
      echo "Install Docker manually: https://www.docker.com/products/docker-desktop/" >&2
      exit 1
      ;;
  esac
}

start_docker() {
  case "$(uname -s)" in
    Darwin)
      start_docker_desktop_mac || {
        echo "error: could not start Docker Desktop. Install from: ${DOCKER_DESKTOP_MAC_URL}" >&2
        exit 1
      }
      ;;
    Linux)
      start_docker_service_linux
      ;;
    *)
      echo "error: unsupported OS: $(uname -s)" >&2
      exit 1
      ;;
  esac
}

ensure_docker() {
  if ! test_docker_cli_installed; then
    install_docker
  fi

  if ! test_docker_compose_available; then
    echo "error: docker compose is not available." >&2
    echo "Install or update Docker Desktop: https://www.docker.com/products/docker-desktop/" >&2
    exit 1
  fi

  if test_docker_daemon_running; then
    return 0
  fi

  start_docker

  if ! wait_for_docker_daemon "$DOCKER_WAIT_TIMEOUT"; then
    show_docker_not_ready_help
    exit 1
  fi
}
