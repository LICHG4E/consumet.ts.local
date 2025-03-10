import { VideoExtractor, IVideo } from '../models';

class Kwik extends VideoExtractor {
  protected override serverName = 'kwik';
  protected override sources: IVideo[] = [];
  private readonly host = 'https://animepahe.com';
  private readonly proxyUrl = 'https://cors.consumet.stream';

  override extract = async (videoUrl: URL, retryCount = 0): Promise<IVideo[]> => {
    try {
      console.log(`Attempting to extract from: ${videoUrl.href}`);

      // Use proxy for the request to avoid server-side blocking
      const useProxy = true; // Toggle this if needed
      const requestUrl = useProxy ? `${this.proxyUrl}/${videoUrl.href}` : videoUrl.href;

      const { data } = await this.client.get(requestUrl, {
        headers: this.getHeaders(),
        timeout: 10000, // 10 second timeout
      });

      console.log(`Received response, length: ${data.length} characters`);

      // Different regex patterns to try for m3u8 extraction
      const patterns = [
        // Standard pattern for m3u8 URLs
        /https?:\/\/[\w\.\-\/]+\.m3u8/i,

        // Pattern for source attribute in JavaScript
        /source\s*:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i,

        // Pattern for escaped URLs in packed JavaScript
        /https?:\\\/\\\/[\w\.\-\\\/]+\.m3u8/i,

        // Broader pattern as last resort
        /https?:[^"'\s]+\.m3u8[^"'\s]*/i,
      ];

      let m3u8Url: string | null = null;

      // Try each pattern until we find a match
      for (const pattern of patterns) {
        const match = data.match(pattern);
        if (match) {
          m3u8Url = match[0];
          // If we matched a pattern with capture group, use that instead
          if (match[1]) m3u8Url = match[1];

          // Clean up escaped slashes if needed
          m3u8Url = m3u8Url!.replace(/\\\//g, '/');

          console.log(`Found m3u8 URL using pattern: ${pattern}`);
          break;
        }
      }

      // If we still don't have a URL, try a more aggressive approach
      if (!m3u8Url) {
        console.log('No m3u8 URL found with basic patterns, checking for packed script...');
        const packedScript = data.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?}\([\s\S]*?\)\)/);

        if (packedScript) {
          console.log('Found packed script, attempting broader extraction...');
          // This is a placeholder for actual unpacking
          // In a real implementation, you'd use a JS evaluator to unpack this

          // For now, we'll just do a more aggressive search in the entire response
          const lastResortMatch = data.match(/https?:[^"'\s]{5,200}\.m3u8[^"'\s]*/i);
          if (lastResortMatch) {
            m3u8Url = lastResortMatch[0];
            console.log('Found m3u8 URL with last resort pattern');
          }
        }
      }

      if (!m3u8Url) {
        throw new Error('m3u8 URL not found in response');
      }

      console.log(`Successfully extracted m3u8 URL: ${m3u8Url}`);

      this.sources.push({
        url: m3u8Url,
        isM3U8: true,
      });

      return this.sources;
    } catch (err) {
      console.error(`Kwik extractor error: ${(err as Error).message}`);

      // Implement retry logic
      if (retryCount < 2) {
        console.log(`Retrying extraction (attempt ${retryCount + 1}/2)...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.extract(videoUrl, retryCount + 1);
      }

      throw new Error(`Failed to extract m3u8 from Kwik: ${(err as Error).message}`);
    }
  };

  private getHeaders() {
    return {
      Referer: this.host,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="122", "Google Chrome";v="122", "Not;A=Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site', // Important for cross-origin requests
      'Upgrade-Insecure-Requests': '1',
    };
  }
}

export default Kwik;
