#!/bin/bash



if [ -f sitemap_papers.json ] || [ -f map.xml ] ; then
    rm ./sitemap_papers.json
    rm ./map.xml
    echo "Old site maps found and removed!"
fi


aws s3api list-objects --bucket carepapers  > sitemap_papers.json


data=`echo $(date '+%Y-%m-%d')`
echo '<?xml version="1.0" encoding="UTF-8"?>' >> map.xml
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'  >> map.xml

variables=`cat  sitemap_papers.json |  jq -r  '.Contents[] |  (.Key | @uri)'  | sed -r 's/%2F/\//g'`

echo $variables

for i in $variables; do 
    echo " <url>\n  <loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/${i}</loc>\n  <lastmod>${data}</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.8</priority>\n </url>"  >> map.xml
#cat sitemap_papers.json | jq -r '.Contents[] | " <url>\n  <loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/\(.Key | @uri)</loc>\n  <lastmod>'${data}'</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.8</priority>\n </url>"'  >> map.xml
done 
echo "</urlset>" >> map.xml

#cat sitemap_papers.json | jq -r


aws s3 cp map.xml  s3://carepapers/map.xml
