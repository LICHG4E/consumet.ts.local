import { VideoExtractor, IVideo } from '../models';

class Kwik extends VideoExtractor {
  protected override serverName = 'kwik';
  protected override sources: IVideo[] = [];
  private readonly host = 'https://animepahe.com';
  // Add rotating user agents to mimic different browsers
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  override extract = async (videoUrl: URL): Promise<IVideo[]> => {
    try {
      // Add delay to mimic human behavior (200-700ms random delay)
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 500) + 200));

      // Generate random cookies and browser fingerprint data
      const randomCookie = `_ga=GA${Math.floor(Math.random() * 9) + 1}.${Math.floor(
        Math.random() * 1000000000
      )}; _gid=GA${Math.floor(Math.random() * 9) + 1}.${Math.floor(
        Math.random() * 1000000000
      )}; __cf_bm=${Buffer.from(Math.random().toString())
        .toString('base64')
        .substring(0, 20)}; kwik_session=${Buffer.from(Date.now().toString()).toString('hex')}`;

      const { data } = await this.client.get(`${videoUrl.href}`, {
        headers: {
          Referer: this.host,
          'User-Agent': this.getRandomUserAgent(),
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
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
          Cookie: randomCookie,
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

      if (
        data.includes('Access Denied') ||
        data.includes('403 Forbidden') ||
        data.includes('Attention Required')
      ) {
        console.error('[Kwik Extractor] Access blocked by server');
        throw new Error(
          'Access denied by the server. The service is blocking requests from this IP address.'
        );
      }

      // Use a regex to match the embedded m3u8 link
      const scriptMatch = data.match(/eval\(function\(p,a,c,k,e,d\).*?m3u8/);
      if (!scriptMatch) throw new Error('No m3u8 found in response');

      const urlMatch = scriptMatch[0].match(/https.*?\.m3u8/);
      if (!urlMatch) throw new Error('m3u8 URL not found');

      this.sources.push({
        url: urlMatch[0],
        isM3U8: true,
      });

      return this.sources;
    } catch (err) {
      console.error(`Kwik extractor error: ${(err as Error).message}`);
      throw new Error(`Failed to extract from Kwik: ${(err as Error).message}`);
    }
  };
}

export default Kwik;
