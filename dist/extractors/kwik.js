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
                const { data } = await this.client.get(`${videoUrl.href}`, {
                    headers: {
                        Referer: this.host,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                    },
                });
                // Use a regex to match the embedded m3u8 link
                const scriptMatch = data.match(/eval\(function\(p,a,c,k,e,d\).*?m3u8/);
                if (!scriptMatch)
                    throw new Error('No m3u8 found in response');
                const urlMatch = scriptMatch[0].match(/https.*?\.m3u8/);
                if (!urlMatch)
                    throw new Error('m3u8 URL not found');
                this.sources.push({
                    url: urlMatch[0],
                    isM3U8: true,
                });
                return this.sources;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
    }
}
exports.default = Kwik;
//# sourceMappingURL=kwik.js.map