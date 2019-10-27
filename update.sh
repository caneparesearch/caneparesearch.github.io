#!/bin/bash 

cd ../webpage_CaRe/
bundle exec jekyll build 
cd ../caneparesearch.github.io
cp -r  ../webpage_CaRe/_site/* .
git add *
