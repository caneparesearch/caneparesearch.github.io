#!/bin/bash 


read -p "Enter text for commit: " tcommit

cd ../webpage_CaRe/
git pull
bundle exec jekyll build 
cd ../caneparesearch.github.io
cp -r  ../webpage_CaRe/_site/* .


#update papers xml 

./update_aws_sitemap.sh

git add *
git commit -m "$tcommit"
git push 
