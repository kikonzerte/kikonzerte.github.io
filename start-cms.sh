#!/bin/bash
cd "$(dirname "$(readlink -f "$0")")"
node cms-server.js
