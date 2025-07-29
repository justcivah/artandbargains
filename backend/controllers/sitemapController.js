const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

const generateSitemap = async (req, res) => {
    try {
        const baseUrl = 'https://artandbargains.com';
        
        // Get current date in ISO format for lastmod
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Static pages with their priorities and change frequencies
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: '1.0' },
            { url: '/shop', changefreq: 'daily', priority: '0.9' },
            { url: '/about', changefreq: 'monthly', priority: '0.7' },
            { url: '/contact', changefreq: 'monthly', priority: '0.6' }
        ];
        
        // Fetch all items from DynamoDB (including out of stock items)
        const itemsParams = {
            TableName: TABLE_NAME,
            FilterExpression: "SK = :sk AND entity_type = :entityType",
            ExpressionAttributeValues: {
                ":sk": "METADATA",
                ":entityType": "item"
            }
        };

        const itemsResult = await dynamoDB.send(new ScanCommand(itemsParams));
        const items = itemsResult.Items || [];
        
        // Start building XML
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        staticPages.forEach(page => {
            sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Add dynamic item pages
        items.forEach(item => {
            // Extract item ID from PK (remove "ITEM#" prefix)
            const itemId = item.PK.replace('ITEM#', '');
            
            // Format lastmod date from insertion_timestamp
            const lastModified = item.insertion_timestamp ? 
                new Date(item.insertion_timestamp).toISOString().split('T')[0] : 
                currentDate;
            
            sitemap += `
  <url>
    <loc>${baseUrl}/shop/item/${itemId}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        // Close XML
        sitemap += `
</urlset>`;

        // Set proper headers
        res.set({
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=604800' // Cache for 1 week
        });
        
        res.send(sitemap);
        
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
};

// Generate sitemap with images for better SEO
const generateSitemapWithImages = async (req, res) => {
    try {
        const baseUrl = 'https://artandbargains.com';
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Static pages
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: '1.0' },
            { url: '/shop', changefreq: 'daily', priority: '0.9' },
            { url: '/about', changefreq: 'monthly', priority: '0.7' },
            { url: '/contact', changefreq: 'monthly', priority: '0.6' }
        ];
        
        // Fetch items with images from DynamoDB (including out of stock items)
        const itemsParams = {
            TableName: TABLE_NAME,
            FilterExpression: "SK = :sk AND entity_type = :entityType",
            ExpressionAttributeValues: {
                ":sk": "METADATA",
                ":entityType": "item"
            },
            ProjectionExpression: "PK, title, insertion_timestamp, description, images, primary_contributor_display"
        };
        
        const itemsResult = await dynamoDB.send(new ScanCommand(itemsParams));
        const items = itemsResult.Items || [];
        
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

        // Add static pages
        staticPages.forEach(page => {
            sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Add item pages with images
        items.forEach(item => {
            // Extract item ID from PK (remove "ITEM#" prefix)
            const itemId = item.PK.replace('ITEM#', '');
            
            const lastModified = item.insertion_timestamp ? 
                new Date(item.insertion_timestamp).toISOString().split('T')[0] : 
                currentDate;
            
            sitemap += `
  <url>
    <loc>${baseUrl}/shop/item/${itemId}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

            // Add images if they exist
            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                item.images.forEach((image) => {
                    if (image.url) {
                        // Ensure the image URL is absolute
                        const imageUrl = image.url.startsWith('http') ? 
                            image.url : 
                            `${baseUrl}${image.url}`;
                        
                        // Create image caption and title
                        const imageCaption = escapeXml(item.title || 'Artwork');
                        const imageTitle = image.alt_text ? 
                            escapeXml(image.alt_text) : 
                            escapeXml(`${item.title} - ${item.primary_contributor_display || 'Art & Bargains'}`);
                        
                        sitemap += `
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${imageCaption}</image:caption>
      <image:title>${imageTitle}</image:title>
    </image:image>`;
                    }
                });
            }

            sitemap += `
  </url>`;
        });

        sitemap += `
</urlset>`;

        res.set({
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=604800' // Cache for 1 week
        });
        
        res.send(sitemap);
        
    } catch (error) {
        console.error('Error generating sitemap with images:', error);
        res.status(500).send('Error generating sitemap');
    }
};

// Generate sitemap index for large catalogs (optional - for future scaling)
const generateSitemapIndex = async (req, res) => {
    try {
        const baseUrl = 'https://artandbargains.com';
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Count total items to determine if we need multiple sitemaps (including out of stock)
        const countParams = {
            TableName: TABLE_NAME,
            FilterExpression: "SK = :sk AND entity_type = :entityType",
            ExpressionAttributeValues: {
                ":sk": "METADATA",
                ":entityType": "item"
            },
            Select: "COUNT"
        };

        const countResult = await dynamoDB.send(new ScanCommand(countParams));
        const itemCount = countResult.Count || 0;

        // If less than 50,000 items, just use a single sitemap
        if (itemCount < 50000) {
            return res.redirect('/sitemap.xml');
        }

        // For large catalogs, create sitemap index
        let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

        res.set({
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=604800' // Cache for 1 week
        });
        
        res.send(sitemapIndex);
        
    } catch (error) {
        console.error('Error generating sitemap index:', error);
        res.status(500).send('Error generating sitemap index');
    }
};

// Helper function to escape XML special characters
const escapeXml = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

module.exports = {
    generateSitemap,
    generateSitemapWithImages,
    generateSitemapIndex
};