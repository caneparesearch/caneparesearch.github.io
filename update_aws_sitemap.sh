#!/bin/bash 

rm ./sitemap_papers.json 
rm ./sitemap_papers.xml 
aws s3api list-objects --bucket carepapers  > sitemap_papers.json

echo "<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">"  >> sitemap_papers.xml 
cat sitemap_papers.json | jq -r '.Contents[] | "<url>\n  <loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/\(.Key | @uri)</loc>\n  <changefreq>monthly</changefreq>\n  <priority>0.8</priority>\n</url>"'  >> sitemap_papers.xml
echo "</urlset>" >> sitemap_papers.xml  
