#!/bin/sh

cd /
cd "$(dirname "$0")"

node ./r.js -o ./build.js
