#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
gnome-terminal -- bash -c "
  [ -f ~/.nvm/nvm.sh ] && source ~/.nvm/nvm.sh
  [ -f ~/.profile ] && source ~/.profile
  [ -f ~/.bashrc ] && source ~/.bashrc
  cd '$SCRIPT_DIR'
  node cms-server.js
  echo ''
  echo 'Server stopped. Press Enter to close.'
  read
"
