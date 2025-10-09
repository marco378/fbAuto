#!/bin/bash
cd fbAuto-main
npm install
cd server
npm install
npx prisma generate
cd ..
node server/src/index.js