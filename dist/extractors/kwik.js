"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
class Kwik extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'kwik';
        this.sources = [];
        this.host = 'https://animepahe.com';
        this.extract = async (videoUrl) => {
            try {
                console.log(`[Debug] Extracting video from: ${videoUrl.href}`);
                // Using a more comprehensive cookie like the one in pahe.ts
                const cookie = '__ddgid_=OTcqdThY3SqrpMKJ; __ddg2_=hYARCDSHUTVXcLWW; __ddg1_=axxddcKnDXN08jslc2Lo; __ddg9_=1.187.213.32; SERVERID=janna; XSRF-TOKEN=eyJpdiI6IjM4V2pYVVhyblQrN2JyVGRheWdyaFE9PSIsInZhbHVlIjoiT1FIUWNCc0FYbHlRZklGN1hNT0hEYi93NkhSVk5kczRadG5uREMyZUpMMVpzbVd2ZjBOTDNCL2FaaGdYMWdrZ1BUU3pXbm83ODFIWTNXdEdZZnQ2ZHQ0OEhyWldud2R6UHBvZHVOTDRZRmRRQ3ZScGdQdnhURkoyZmJQbURvVE8iLCJtYWMiOiJkMzc1YzZmZjA2ZjlkNzE2ZDk3YzViMDNjZDU3MWM3NDg3MjJiZjExMDk5Y2NhMTk2ODI5YzFmY2I3MGY2ZDg5IiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IkJsekRaWXI3dzNFT0dHeDFnRnNKK0E9PSIsInZhbHVlIjoiYWpLK2w4ZGcxQnBoWFBHMmpFNW0wYUNUZ2dUTzBHRU1XT3ZMNk4wSGFpcHpvSkJxVjZJZ0pMSWU4TDVFR21janJnQ1Rxb1Z3RHdtVnU5Q2o1KzJWdldwQ3RsalQrdjVlQy9ReXZaYkxIS2l2YkdMM212VXhSSDd5TDFlZG52YmQiLCJtYWMiOiI4YjExYmM3MDEyOThjOTljYmY1ODZlNDkxNjA3NTlkM2E1MjE2NjViNWY3NDI3ZDJmYjJkNWFiYzRiZTE3MGU3IiwidGFnIjoiIn0%3D; aud=jpn; av1=0; res=480';
                const { data } = await this.client.get(`${videoUrl.href}`, {
                    headers: {
                        Referer: this.host,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        Connection: 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'same-origin',
                        'Sec-Fetch-User': '?1',
                        'Sec-Ch-Ua': '"Chromium";v="122", "Google Chrome";v="122", "Not;A=Brand";v="99"',
                        'Sec-Ch-Ua-Mobile': '?0',
                        'Sec-Ch-Ua-Platform': '"Windows"',
                        Pragma: 'no-cache',
                        'Cache-Control': 'no-cache',
                        Cookie: cookie,
                    },
                    // Support for proxy if configured in environment variables
                    ...(process.env.PROXY_HOST && process.env.PROXY_PORT
                        ? {
                            proxy: {
                                host: process.env.PROXY_HOST,
                                port: parseInt(process.env.PROXY_PORT, 10),
                                ...(process.env.PROXY_AUTH
                                    ? {
                                        auth: (() => {
                                            const [username, password] = process.env.PROXY_AUTH.split(':');
                                            return { username, password };
                                        })(),
                                    }
                                    : {}),
                            },
                        }
                        : {}),
                    maxRedirects: 5,
                    timeout: 10000,
                    validateStatus: status => status < 500,
                });
                if (data.includes('Access Denied') ||
                    data.includes('403 Forbidden') ||
                    data.includes('Attention Required')) {
                    console.error('[Kwik Extractor] Access blocked by server');
                    throw new Error('Access denied by the server. The service is blocking requests from this IP address.');
                }
                // Use the working m3u8 extraction method from pahe.ts
                const m3u8Url = this.extractM3u8FromScript(data);
                if (!m3u8Url) {
                    console.error('[Kwik Extractor] No m3u8 URL found in response');
                    throw new Error('No m3u8 found in response');
                }
                console.log(`[Debug] Successfully extracted m3u8 URL: ${m3u8Url}`);
                this.sources.push({
                    url: m3u8Url,
                    isM3U8: true,
                });
                return this.sources;
            }
            catch (err) {
                console.error(`Kwik extractor error: ${err.message}`);
                throw new Error(`Failed to extract from Kwik: ${err.message}`);
            }
        };
    }
    // The essential function from pahe.ts that works correctly
    extractM3u8FromScript(html) {
        try {
            const match = /(eval)(\(function[\s\S]*?)(<\/script>)/s.exec(html);
            if (match && match[2]) {
                const script = match[2].replace('eval', '');
                const link = eval(script).match(/https.*?m3u8/);
                return link ? link[0] : null;
            }
        }
        catch (error) {
            console.error('Error extracting m3u8 from script:', error);
        }
        return null;
    }
}
exports.default = Kwik;
//# sourceMappingURL=kwik.js.map