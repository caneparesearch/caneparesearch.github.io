#!/bin/bash

cd ../caneparesearch.github.io

if [ -f sitemap_papers.json ] || [ -f map.xml ] ; then
    rm ./sitemap_papers.json
    rm ./map.xml
    echo "Old site maps found and removed!"
fi

aws s3api list-objects --bucket carepapers  > sitemap_papers.json

# These lines put together the content of the xml file
data=`echo $(date '+%Y-%m-%d')`
echo '<?xml version="1.0" encoding="UTF-8"?>' >> map.xml
echo '<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'  >> map.xml

# Extract important data from JSON and remove undesired caracthers

# cat sitemap_papers.json | jq -r '.Contents[] | " <url>\n  <loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/\(.Key | @uri)</loc>\n  <lastmod>'${data}'</lastmod>\n  <changefreq>monthly</changefreq>\n  <priority>0.8</priority>\n </url>"'  >> map.xml
variables=`cat  sitemap_papers.json |  jq -r  '.Contents[] |  (.Key | @uri)'  | sed -r 's/%2F/\//g' | sed '/\/$/d' | sed '/\.xml$/d' |  sed '/\.html$/d' | sed '/\.png$/d' | sed '/\.txt$/d'`

for i in $variables; do
    echo -e "<url>\n<loc>https://carepapers.s3-ap-southeast-1.amazonaws.com/${i}</loc>\n<lastmod>${data}</lastmod>\n<changefreq>monthly</changefreq>\n</url>"  >> map.xml
done
echo "</urlset>" >> map.xml



mv map.xml tmp.xml

iconv -f MACROMAN -t UTF-8 tmp.xml > map.xml 

rm tmp.xml 

cat map.xml

#upload list to amazon bucket
aws s3 cp map.xml  s3://carepapers/map.xml
