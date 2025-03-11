import { VideoExtractor, IVideo } from '../models';
declare class Kwik extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly host;
    private readonly userAgents;
    private getRandomUserAgent;
    extract: (videoUrl: URL) => Promise<IVideo[]>;
}
export default Kwik;
