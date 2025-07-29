const generateRobotsTxt = (req, res) => {
    const baseUrl = 'https://artandbargains.com';
    
    const robotsTxt = `User-agent: *
Allow: /

# Disallow admin and login pages
Disallow: /admin/
Disallow: /login

# Allow search engines to crawl shop pages
Allow: /shop/
Allow: /shop/item/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Additional sitemaps (optional)
# Sitemap: ${baseUrl}/sitemap-simple.xml

# Crawl delay (optional - be nice to search engines)
Crawl-delay: 1

# Host directive (helps with canonicalization)
Host: ${baseUrl}`;

    res.set({
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=604800' // Cache for 1 week
    });
    
    res.send(robotsTxt);
};

module.exports = {
    generateRobotsTxt
};