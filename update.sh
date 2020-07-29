#!/bin/bash 


read -p "Enter text for commit: " tcommit

cd ../webpage_CaRe/
bundle exec jekyll build 
cd ../caneparesearch.github.io
cp -r  ../webpage_CaRe/_site/* .
git add *
git commit -m "$tcommit"
git push 
