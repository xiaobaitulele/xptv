const cheerio = createCheerio()
let $config = argsify($config_str)
const SITE = $config.site || "https://nycvod.com"
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
    'Referer': `${SITE}/`,
    'Origin': `${SITE}`,
    'User-Agent': UA,
}

const appConfig = {
    ver: 1,
    title: "纽约影院",
    site: SITE,
    tabs: [{
        name: '电影',
        ext: {
            url: `${SITE}/vodshow/1--------{page}---.html`
        },
    },{
        name: '电视剧',
        ext: {
            url: `${SITE}/vodshow/2--------{page}---.html`
        },
    },{
        name: '综艺',
        ext: {
            url: `${SITE}/vodshow/3--------{page}---.html`
        },
    },{
        name: '动漫',
        ext: {
            url: `${SITE}/vodshow/4--------{page}---.html`
        },
    },{
        name: '短剧',
        ext: {
            url: `${SITE}/vodshow/50--------{page}---.html`
        },
    },{
        name: '纪录片',
        ext: {
            url: `${SITE}/vodshow/29--------{page}---.html`
        },
    },{
        name: '伦理片（18+）',
        ext: {
            url: `${SITE}/vodshow/29--------{page}---.html`
        },
    }
    ]
}

async function getConfig() {
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
    $('div.public-list-box').each((_, each) => {

        const a = $(each).find('a.public-list-exp');
        const img = $(each).find('img.gen-movie-img');

        let pic = img.attr("data-src") || img.attr("src") || "";

        if (pic && !pic.startsWith("http")) {
            pic = appConfig.site + pic;
        }

        cards.push({
            vod_id: a.attr("href"),
            vod_name: a.attr("title"),
            vod_pic: pic,
            vod_remarks: $(each).find('span.public-prt').text().trim(),
            ext: {
                url: appConfig.site + a.attr("href"),
            },
        });

    });

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
    $('div.anthology-tab>div>a').each((_, each) => {
        gn.push($(each).clone().children().remove().end().text().trim())
    })

    $('div.anthology-list-box').each((i, each) => {
        let group = {
            title: gn[i],
            tracks: [],
        }
        $(each).find('ul.anthology-list-play > li').each((_, item) => {
            group.tracks.push({
                name: $(item).text().trim(),
                pan: '',
                ext: {
                    url: appConfig.site + $(item).children(":first").attr('href')
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
    const player_data = JSON.parse(data.match(/player_aaaa=(.+?)<\/script>/)[1])
    let m3u
    if (player_data.encrypt == '1') {
        m3u = unescape(player_data.url);
    } else if (player_data.encrypt == '2') {
        m3u = unescape(base64decode(player_data.url));
    }
    return jsonify({ 'urls': [m3u] })
}
async function opensafari(url){
    $utils.openSafari(url, UA);

}
async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    let url=`${appConfig.site}/vodsearch/${text}----------${page}---.html`
    const { data } = await $fetch.get(url, {
        headers
    })


    //$print(argsify(data))
    const $=cheerio.load(data)
    if($("input.verify-submit").attr("value")=='提交验证'){
        opensafari(url)
    }

    $('.public-list-box').each((_, each) => {
        const box = $(each)

        const a = box.find('.public-list-exp')
        const img = a.find('img')

        let pic = img.attr("data-src") || img.attr("src")
        if (pic && pic.startsWith('/')) {
            pic = appConfig.site + pic
        }

        const name = box.find('.thumb-txt').text().trim()
        const remarks = box.find('.public-list-prb').text().trim()
        const href = a.attr("href")

        cards.push({
            vod_id: href,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: remarks,
            ext: {
                url: appConfig.site + href,
            },
        })
    })
    return jsonify({
        list: cards,
    })
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
