<?xml version="1.0" encoding="UTF-8"?>
<!--
  How a browser shows the site's RSS feeds (feed.xml, papers/feed.xml) to a visitor who opens one:
  as a short page saying what the feed is and how to follow it, with its latest items, instead of
  the raw XML. Feed readers ignore it and read the XML. Styled by css/feed.css: the site's security
  policy allows no inline styles.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="title"/> (RSS feed)</title>
        <link rel="stylesheet" href="/css/feed.css"/>
      </head>
      <body>
        <main>
          <p class="feed-kind">RSS feed</p>
          <h1><xsl:value-of select="title"/></h1>
          <p>This is a feed: copy its address into a feed reader, such as Feedly, Inoreader or NetNewsWire, to see each new item there as soon as it appears.</p>
          <p class="feed-address"><code><xsl:value-of select="atom:link/@href"/></code></p>
          <p><a href="{link}">Visit the website</a></p>
          <h2>Latest</h2>
          <ul>
            <xsl:for-each select="item">
              <li>
                <a href="{link}"><xsl:value-of select="title"/></a>
                <span class="feed-date"><xsl:value-of select="substring(pubDate, 6, 11)"/></span>
              </li>
            </xsl:for-each>
          </ul>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
