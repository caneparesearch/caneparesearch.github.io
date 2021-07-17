#!/bin/bash 


read -p "Enter text for commit: " tcommit

#cd ../source-care-website/
git pull
bundle exec jekyll build 
cd ../caneparesearch.github.io
cp -r  ../source-care-website/_site/* .

#update website

git add *
git commit -m "$tcommit"
git push 

#update papers xml 
../source-care-website/update_aws_sitemap.sh
