#!/bin/bash

set -e

read -p "Enter text for commit: " tcommit

cd ../source-care-website
git pull
bundle exec jekyll build
./update_aws_sitemap.sh

cd ../caneparesearch.github.io
git pull

echo "$PWD" "This is the folder"
rsync -a --delete --exclude='.git' --exclude='*.sh' ../source-care-website/_site/ .

#update website
git config pull.rebase false
git add -A
git commit -m "$tcommit"
git push
