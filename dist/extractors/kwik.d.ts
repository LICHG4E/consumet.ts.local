import { VideoExtractor, IVideo } from '../models';
declare class Kwik extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly host;
    private readonly proxyUrl;
    extract: (videoUrl: URL, retryCount?: number) => Promise<IVideo[]>;
    private getHeaders;
}
export default Kwik;
