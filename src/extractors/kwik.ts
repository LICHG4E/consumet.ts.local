import { VideoExtractor, IVideo } from '../models';

class Kwik extends VideoExtractor {
  protected override serverName = 'kwik';
  protected override sources: IVideo[] = [];
  private readonly host = 'https://animepahe.com';

  override extract = async (videoUrl: URL): Promise<IVideo[]> => {
    try {
      const { data } = await this.client.get(`${videoUrl.href}`, {
        headers: { Referer: this.host },
      });

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
      throw new Error((err as Error).message);
    }
  };
}

export default Kwik;
