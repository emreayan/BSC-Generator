import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// PDF Generation Endpoint
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { htmlContent, filename } = req.body;

        if (!htmlContent) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Safe filename
        const safeFilename = (filename || 'BSC_Document')
            .replace(/[^a-zA-Z0-9\s_-]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 50) + '.pdf';

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set HTML content
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF (A4 format)
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '5mm',
                right: '5mm',
                bottom: '5mm',
                left: '5mm'
            }
        });

        await browser.close();

        // Set headers for proper file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'PDF could not be generated' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 PDF Server running on http://localhost:${PORT}`);
});
