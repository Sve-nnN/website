<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Sitemap — Juan Carlos Angulo</title>
        <style>
          body {
            background: #FAFAF7;
            color: #12141C;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 24px;
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.2;
            margin: 0 0 16px 0;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #E5E5DE;
          }
          th {
            background: #F7581E;
            color: #FAFAF7;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.4;
          }
          td {
            font-size: 14px;
            font-weight: 400;
            line-height: 1.5;
          }
          tr:nth-child(even) td {
            background: #F0F0EA;
          }
          a {
            color: #F7581E;
          }
          .footer-line {
            margin-top: 16px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <h1>Sitemap — Juan Carlos Angulo</h1>
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Last Modified</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sm:urlset/sm:url">
              <tr>
                <td>
                  <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                </td>
                <td>
                  <xsl:value-of select="sm:lastmod"/>
                </td>
                <td>
                  <!-- sitemap.xml/route.ts currently always emits both
                       hreflang="es" and hreflang="en" xhtml:link children for
                       every url entry, so the xsl:otherwise branch below is
                       defensive/future-proofing rather than reachable today
                       (IN-01). -->
                  <xsl:choose>
                    <xsl:when test="xhtml:link">
                      <xsl:for-each select="xhtml:link">
                        <xsl:value-of select="@hreflang"/>
                        <xsl:if test="position() != last()">
                          <xsl:text>, </xsl:text>
                        </xsl:if>
                      </xsl:for-each>
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:text>—</xsl:text>
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
        <p class="footer-line">
          <xsl:value-of select="count(sm:urlset/sm:url)"/>
          <xsl:text> URLs — </xsl:text>
          <a href="/sitemap.html">view grouped list</a>
        </p>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
