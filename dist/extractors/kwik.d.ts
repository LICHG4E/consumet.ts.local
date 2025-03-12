import { VideoExtractor, IVideo } from '../models';
declare class Kwik extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    private readonly host;
    private extractM3u8FromScript;
    extract: (videoUrl: URL) => Promise<IVideo[]>;
}
export default Kwik;
