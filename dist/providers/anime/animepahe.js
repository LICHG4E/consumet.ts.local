"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const models_1 = require("../../models");
const extractors_1 = require("../../extractors");
class AnimePahe extends models_1.AnimeParser {
    constructor() {
        super(...arguments);
        this.name = 'AnimePahe';
        this.baseUrl = 'https://animepahe.ru';
        this.logo = 'https://animepahe.com/pikacon.ico';
        this.classPath = 'ANIME.AnimePahe';
        // private readonly sgProxy = 'https://cors.consumet.stream';
        /**
         * @param query Search query
         */
        this.search = async (query) => {
            try {
                const { data } = await this.client.get(`${this.baseUrl}/api?m=search&q=${encodeURIComponent(query)}`, {
                    headers: this.Headers(false),
                });
                const res = {
                    results: data.data.map((item) => ({
                        id: item.session,
                        title: item.title,
                        image: item.poster,
                        rating: item.score,
                        releaseDate: item.year,
                        type: item.type,
                    })),
                };
                return res;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        /**
         * @param id id format id/session
         * @param episodePage Episode page number (optional) default: -1 to get all episodes. number of episode pages can be found in the anime info object
         */
        this.fetchAnimeInfo = async (id, episodePage = -1) => {
            const animeInfo = {
                id: id,
                title: '',
            };
            try {
                const res = await this.client.get(`${this.baseUrl}/anime/${id}`, { headers: this.Headers(id) });
                const $ = (0, cheerio_1.load)(res.data);
                animeInfo.title = $('div.title-wrapper > h1 > span').first().text();
                animeInfo.image = $('div.anime-poster a').attr('href');
                animeInfo.cover = `https:${$('div.anime-cover').attr('data-src')}`;
                animeInfo.description = $('div.anime-summary').text().trim();
                animeInfo.genres = $('div.anime-genre ul li')
                    .map((i, el) => $(el).find('a').attr('title'))
                    .get();
                animeInfo.hasSub = true;
                switch ($('div.anime-info p:icontains("Status:") a').text().trim()) {
                    case 'Currently Airing':
                        animeInfo.status = models_1.MediaStatus.ONGOING;
                        break;
                    case 'Finished Airing':
                        animeInfo.status = models_1.MediaStatus.COMPLETED;
                        break;
                    default:
                        animeInfo.status = models_1.MediaStatus.UNKNOWN;
                }
                animeInfo.type = $('div.anime-info > p:contains("Type:") > a')
                    .text()
                    .trim()
                    .toUpperCase();
                animeInfo.releaseDate = $('div.anime-info > p:contains("Aired:")')
                    .text()
                    .split('to')[0]
                    .replace('Aired:', '')
                    .trim();
                animeInfo.studios = $('div.anime-info > p:contains("Studio:")')
                    .text()
                    .replace('Studio:', '')
                    .trim()
                    .split('\n');
                animeInfo.totalEpisodes = parseInt($('div.anime-info > p:contains("Episodes:")').text().replace('Episodes:', ''));
                animeInfo.recommendations = [];
                $('div.anime-recommendation .col-sm-6').each((i, el) => {
                    var _a, _b, _c;
                    (_a = animeInfo.recommendations) === null || _a === void 0 ? void 0 : _a.push({
                        id: (_b = $(el).find('.col-2 > a').attr('href')) === null || _b === void 0 ? void 0 : _b.split('/')[2],
                        title: $(el).find('.col-2 > a').attr('title'),
                        image: $(el).find('.col-2 > a > img').attr('src') || $(el).find('.col-2 > a > img').attr('data-src'),
                        url: `${this.baseUrl}/anime/${(_c = $(el).find('.col-2 > a').attr('href')) === null || _c === void 0 ? void 0 : _c.split('/')[2]}`,
                        releaseDate: $(el).find('div.col-9 > a').text().trim(),
                        status: $(el).find('div.col-9 > strong').text().trim(),
                    });
                });
                animeInfo.relations = [];
                $('div.anime-relation .col-sm-6').each((i, el) => {
                    var _a, _b, _c;
                    (_a = animeInfo.relations) === null || _a === void 0 ? void 0 : _a.push({
                        id: (_b = $(el).find('.col-2 > a').attr('href')) === null || _b === void 0 ? void 0 : _b.split('/')[2],
                        title: $(el).find('.col-2 > a').attr('title'),
                        image: $(el).find('.col-2 > a > img').attr('src') || $(el).find('.col-2 > a > img').attr('data-src'),
                        url: `${this.baseUrl}/anime/${(_c = $(el).find('.col-2 > a').attr('href')) === null || _c === void 0 ? void 0 : _c.split('/')[2]}`,
                        releaseDate: $(el).find('div.col-9 > a').text().trim(),
                        status: $(el).find('div.col-9 > strong').text().trim(),
                        relationType: $(el).find('h4 > span').text().trim(),
                    });
                });
                animeInfo.episodes = [];
                if (episodePage < 0) {
                    const { data: { last_page, data }, } = await this.client.get(`${this.baseUrl}/api?m=release&id=${id}&sort=episode_asc&page=1`, {
                        headers: this.Headers(id),
                    });
                    animeInfo.episodePages = last_page;
                    animeInfo.episodes.push(...data.map((item) => ({
                        id: `${id}/${item.session}`,
                        number: item.episode,
                        title: item.title,
                        image: item.snapshot,
                        duration: item.duration,
                        url: `${this.baseUrl}/play/${id}/${item.session}`,
                    })));
                    for (let i = 1; i < last_page; i++) {
                        animeInfo.episodes.push(...(await this.fetchEpisodes(id, i + 1)));
                    }
                }
                else {
                    animeInfo.episodes.push(...(await this.fetchEpisodes(id, episodePage)));
                }
                return animeInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        /**
         *
         * @param episodeId episode id
         */
        this.fetchEpisodeSources = async (episodeId) => {
            try {
                const { data } = await this.client.get(`${this.baseUrl}/play/${episodeId}`, {
                    headers: this.Headers(episodeId.split('/')[0]),
                });
                const $ = (0, cheerio_1.load)(data);
                const links = $('div#resolutionMenu > button').map((i, el) => ({
                    url: $(el).attr('data-src'),
                    quality: $(el).text(),
                    audio: $(el).attr('data-audio'),
                }));
                const iSource = {
                    headers: {
                        Referer: 'https://kwik.cx/',
                    },
                    sources: [],
                };
                for (const link of links) {
                    const res = await new extractors_1.Kwik(this.proxyConfig).extract(new URL(link.url));
                    res[0].quality = link.quality;
                    res[0].isDub = link.audio === 'eng';
                    iSource.sources.push(res[0]);
                }
                return iSource;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        this.fetchEpisodes = async (session, page) => {
            const res = await this.client.get(`${this.baseUrl}/api?m=release&id=${session}&sort=episode_asc&page=${page}`, { headers: this.Headers(session) });
            const epData = res.data.data;
            return [
                ...epData.map((item) => ({
                    id: `${session}/${item.session}`,
                    number: item.episode,
                    title: item.title,
                    image: item.snapshot,
                    duration: item.duration,
                    url: `${this.baseUrl}/play/${session}/${item.session}`,
                })),
            ];
        };
        /**
         * @deprecated
         * @attention AnimePahe doesn't support this method
         */
        this.fetchEpisodeServers = (episodeLink) => {
            throw new Error('Method not implemented.');
        };
    }
    Headers(sessionId) {
        // Generate a random user agent from a pool
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        ];
        // Randomize some values to avoid detection
        const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const randomCookie = `__ddg2_=${Math.random().toString(36).substring(2)}; sessionId=${Math.random()
            .toString(36)
            .substring(2)}`;
        return {
            authority: 'animepahe.ru',
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            cookie: randomCookie,
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            'sec-ch-ua': '"Chromium";v="122", "Google Chrome";v="122", "Not;A=Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': sessionId ? 'same-origin' : 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': randomAgent,
            referer: sessionId ? `https://animepahe.ru/anime/${sessionId}` : 'https://animepahe.ru/',
        };
    }
}
exports.default = AnimePahe;
// (async () => {
//   const animepahe = new AnimePahe();
//   const anime = await animepahe.search('Classroom of the elite');
//   const info = await animepahe.fetchAnimeInfo(anime.results[0].id);
//   // console.log(info);
//  const sources = await animepahe.fetchEpisodeSources(info.episodes![0].id);
//   console.log(sources);
// })();
//# sourceMappingURL=animepahe.js.map