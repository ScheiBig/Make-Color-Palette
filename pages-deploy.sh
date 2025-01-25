#!/bin/bash

## chmod +x pages-deploy.sh if it doesn't work ##

# deploy project
npm run build

# Create a temporary directory
temp_dir=$(mktemp -d)

# Copy contents of dist directory to temporary directory
cp -r dist/* "$temp_dir"

# Switch to the pages branch
git switch pages

# Clear the current working directory
rm -rf *

# Copy the contents of the temporary directory to the current working directory
cp -r "$temp_dir"/* .

# Add all changes to git
git add .

# Commit with the default editor
git commit

# Push changes to the remote repository
git push origin pages

# Switch back to the main branch
git switch main

# Remove the temporary directory
rm -rf "$temp_dir"
