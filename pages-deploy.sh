#!/bin/bash

## chmod +x pages-deploy.sh if it doesn't work ##

npm i
npm run build

git add dist/*
git commit

temp_dir=$(mktemp -d)
cp -r dist/* "$temp_dir"

git switch pages
rm -rf *
cp -r "$temp_dir"/* .

git add .
git commit
git push origin pages

git switch main

rm -rf "$temp_dir"
