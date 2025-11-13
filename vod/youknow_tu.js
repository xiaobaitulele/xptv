const cheerio = createCheerio()


//打开成人开关  {"age18":true}
let $config = safeJSONParse($config_str)
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
    'Referer': 'https://www.youknow.tv/',
    'Origin': 'https://www.youknow.tv',
    'User-Agent': UA,
}

const appConfig = {
    ver: 1,
    title: "youknow_兔",
    site: "https://www.youknow.tv",
    tabs: [{
        name: '剧集',
        ext: {
            url: 'https://www.youknow.tv/show/1--------{page}---/'
        },
    }, {
        name: '电影',
        ext: {
            url: 'https://www.youknow.tv/show/2--------{page}---/'
        },
    }, {
        name: '综艺',
        ext: {
            url: 'https://www.youknow.tv/show/3--------{page}---/'
        },
    }, {
        name: '动漫',
        ext: {
            url: 'https://www.youknow.tv/show/4--------{page}---/'
        },
    }, {
        name: '短剧',
        ext: {
            url: 'https://www.youknow.tv/show/55--------{page}---/'
        },
    }, {
        name: '纪录片',
        ext: {
            url: 'https://www.youknow.tv/show/5--------{page}---/'
        },
    }
    ]
}

async function getConfig() {
    if($config?.age18){
        if (!appConfig.tabs.some(t => t.name === '成人')) {
            appConfig.tabs.push({
                name: '成人',
                ext: {
                    url: 'https://www.youknow.tv/show/57--------{page}---/'
                }
            });
        }
    }
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    let url = ext.url
    let page = ext.page || 1
    url = url.replace('{page}', page)

    const { data } = await $fetch.get(url, {
        headers
    })

    const $ = cheerio.load(data)
    $('div.module>a').each((_, each) => {
        cards.push({
            vod_id: $(each).attr('href'),
            vod_name: $(each).attr('title'),
            vod_pic: appConfig.site + $(each).find('div.module-item-pic>img').attr('src'),
            vod_remarks: $(each).find('div.module-item-note').text().trim(),
            ext: {
                url: appConfig.site + $(each).attr('href'),
            },
        })
    })

    return jsonify({
        list: cards,
    });
}

async function getTracks(ext) {

    ext = argsify(ext)
    let groups = []
    let url = ext.url

    const { data } = await $fetch.get(url, {
        headers
    })

    const $ = cheerio.load(data)
    let gn = []
    $('div.module-tab-items-box div.module-tab-item').each((_, each) => {
        gn.push($(each).find("span").text())
    })

    $('div.module div.module-list').each((i, each) => {
        let group = {
            title: gn[i],
            tracks: [],
        }
        $(each).find('div.module-play-list-content > a').each((_, item) => {
            group.tracks.push({
                name: $(item).text(),
                ext: {
                    url: appConfig.site + $(item).attr('href')
                }
            })
        })
        groups.push(group)
    })

    return jsonify({ list: groups })
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    const { data } = await $fetch.get(url, {
        headers
    })
    var player_data = JSON.parse(data.match(/player_aaaa=(.+?)<\/script>/)[1])

    let m3u="";
    if (player_data.encrypt == '1') {
        m3u = unescape(player_data.url);
    } else if (player_data.encrypt == '2') {
        m3u = unescape(base64decode(player_data.url));
    }
    return jsonify({ 'urls': [m3u] })
}
async function search(ext) {
    ext = argsify(ext)
    let cards = [];

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    const url = appConfig.site + `/search/${text}----------${page}---/`
    const { data } = await $fetch.get(url, {
        headers
    })

    const $ = cheerio.load(data)
    $('div.module-items .module-card-item').each((_, each) => {
        cards.push({
            vod_id: $(each).find('a.module-card-item-poster').attr('href'),
            vod_name: $(each).find('div.module-card-item-title').text().trim(),
            vod_pic: appConfig.site + $(each).find('div.module-item-pic').children(":first").attr('src'),
            vod_remarks: $(each).find('div.module-item-note').text(),
            ext: {
                url: appConfig.site + $(each).find('a.module-card-item-poster').attr('href'),
            },
        })
    })

    return jsonify({
        list: cards,
    })
}
function safeJSONParse(s) {
    try {
        return JSON.parse(s);
    } catch (e) {
        return "";
    }
}
function base64decode(str) {
    var base64DecodeChars = new Array(-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1);
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        do {
            c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
        } while (i < len && c1 == -1);
        if (c1 == -1)
            break;
        do {
            c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
        } while (i < len && c2 == -1);
        if (c2 == -1)
            break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 == 61)
                return out;
            c3 = base64DecodeChars[c3]
        } while (i < len && c3 == -1);
        if (c3 == -1)
            break;
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 == 61)
                return out;
            c4 = base64DecodeChars[c4]
        } while (i < len && c4 == -1);
        if (c4 == -1)
            break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4)
    }
    return out
}
