#!/bin/bash 

rm ./sitemap_papers.json 
rm ./sitemap_papers.xml 
ls -lrt sitemap_papers.*
aws s3api list-objects --bucket carepapers  > sitemap_papers.json


data=`echo $(date '+%Y-%m-%d')`
echo '<?xml version="1.0" encoding="UTF-8"?>' >> sitemap_papers.xml  
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'  >> sitemap_papers.xml 
cat sitemap_papers.json | jq -r '.Contents[] | " <url>\n  <loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/\(.Key | @uri)</loc>\n  <lastmod>'${data}'</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.8</priority>\n </url>"'  >> sitemap_papers.xml
echo "</urlset>" >> sitemap_papers.xml  
