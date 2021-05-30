#!/bin/bash 

rm ./sitemap_papers.json 
rm ./map.xml 


aws s3api list-objects --bucket carepapers  > sitemap_papers.json


data=`echo $(date '+%Y-%m-%d')`
echo '<?xml version="1.0" encoding="UTF-8"?>' >> map.xml  
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'  >> map.xml 
cat sitemap_papers.json | jq -r '.Contents[] | " <url>\n  <loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/\(.Key | @uri)</loc>\n  <lastmod>'${data}'</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.8</priority>\n </url>"'  >> map.xml
echo "</urlset>" >> map.xml  


aws s3 cp map.xml  s3://carepapers/map.xml 
