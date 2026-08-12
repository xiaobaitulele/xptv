//如果更换域名了可以自己增加自定义配置 {"site":"https://gimytv.ai"}
const cheerio = createCheerio()
const CryptoJS = createCryptoJS()
//JL / JCC  / djplayer 未做

let $config = argsify($config_str)
const SITE = $config.site || "https://gimytv.ai"
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
    'Referer': `${SITE}/`,
    'Origin': `${SITE}`,
    'User-Agent': UA,
}
const appConfig = {
    ver: 1,
    title: "剧迷",
    site: SITE,
    tabs: [{
        name: '陆剧',
        ext: {
            url: `${SITE}/type/13-{page}.html`
        },
    }, {
        name: '短剧',
        ext: {
            url: `${SITE}/type/34-{page}.html`
        },
    }, {
        name: '韩剧',
        ext: {
            url: `${SITE}/type/20-{page}.html`
        },
    }, {
        name: '美剧',
        ext: {
            url: `${SITE}/type/16-{page}.html`
        },
    }, {
        name: '日剧',
        ext: {
            url: `${SITE}/type/15-{page}.html`
        },
    }, {
        name: '台剧',
        ext: {
            url: `${SITE}/type/14-{page}.html`
        },
    }, {
        name: '港剧',
        ext: {
            url: `${SITE}/type/21-{page}.html`
        },
    }, {
        name: '海外剧',
        ext: {
            url: `${SITE}/type/31-{page}.html`
        },
    }, {
        name: '纪录片',
        ext: {
            url: `${SITE}/type/22-{page}.html`
        },
    }, {
        name: '电影',
        ext: {
            url: `${SITE}/type/1-{page}.html`
        },
    }, {
        name: '动漫',
        ext: {
            url: `${SITE}/type/4-{page}.html`
        },
    },{
        name: '综艺',
        ext: {
            url: `${SITE}/type/29-{page}.html`
        },
    },
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

    const {data} = await $fetch.get(url, {
        headers
    })

    const $ = cheerio.load(data)
    $("ul#content>li").each((_, each) => {
        cards.push({
            vod_id: $(each).find("a.video-pic").attr("href"),
            vod_name: $(each).find(".title h5 a").attr("title"),
            vod_pic: $(each).find("a.video-pic").attr("data-original"),
            vod_remarks: $(each).find("a.video-pic span.note").text().trim(),
            ext: {
                url: appConfig.site + $(each).find("a.video-pic").attr("href")
            }
        });
    })
    return jsonify({
        list: cards,
    });
}

async function getTracks(ext) {
    ext = argsify(ext)
    let groups = []
    let url = ext.url

    const {data} = await $fetch.get(url, {
        headers
    })
    const $ = cheerio.load(data)
    let gn = []
    $("div.playlist-mobile").each((i, each) => {
        gn.push($(each).children(":first").children(":first").text().trim())
        let group = {
            title: gn[i],
            tracks: [],
        }
        $(each).find("ul>li").each((_, item) => {
            group.tracks.push({
                name: $(item).children(":first").text(),
                pan: '',
                ext: {
                    url: appConfig.site + $(item).children(":first").attr("href")
                }
            })
        })
        groups.push(group)
    })
    return jsonify({list: groups})
}

async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    const {data} = await $fetch.get(url, {
        headers
    })
    const player_data = JSON.parse(data.match(/player_data=(.+?)<\/script>/)[1])

    if (player_data.encrypt == "1") {
        player_data.url = unescape(player_data.url);
    } else if (player_data.encrypt == "2") {
        player_data.url = unescape(base64decode(player_data.url));
    }

    let jctype = 'normal';

    if (player_data.url.indexOf('JL-') != -1) {
        jctype = 'JL4K';
    }

    if (player_data.url.indexOf('JL-') != -1) {
        jctype = 'JL2K';
    }

    if (player_data.url.indexOf('JLDJ-') != -1) {
        jctype = 'JLDJ';
    }

    if (player_data.url.indexOf('JK1-') != -1) {
        jctype = 'JK1';
    }

    if (player_data.url.indexOf('JK2-') != -1) {
        jctype = 'JK2';
    }

    if (player_data.url.indexOf('Disney-') != -1) {
        jctype = 'Disney';
    }

    if (player_data.url.indexOf('qingshan-') != -1) {
        jctype = 'qingshan';
    }

    if (player_data.url.indexOf('NSYS-') !== -1) {
        jctype = 'NSYS';
    }

    if (player_data.url.indexOf('NBY-') != -1) {
        jctype = 'NBY';
    }

    if (player_data.url.indexOf('JinLiDj-') != -1) {
        jctype = 'djplayer';
    }

    if (player_data.url.indexOf('znjson-') != -1) {
        jctype = 'znjson';
    }

    if (player_data.url.indexOf('znkan-') != -1) {
        jctype = 'znjson';
    }


// kemi jc
    const kemiSources = [
        'ZAQP',
        'KMQP',
        'kemi',
        'KM3-',
        'KM1080',
        'KMHD-',
        'KM-',
        'km-',
        'BYG',
        'seven'
    ];

    for (let i = 0; i < kemiSources.length; i++) {
        if (player_data.url.indexOf(kemiSources[i]) !== -1) {
            jctype = 'kemi';
            break;
        }
    }


// etc jc
    const etcjcSources = [
        'iqiyi.com',
        'bilibili.com',
        'v.qq.com',
        'sohu.com',
        'pptv.com',
        'letv.com',
        'xigua.com',
        'mgtv.com'
    ];

    for (let i = 0; i < etcjcSources.length; i++) {
        if (player_data.url.indexOf(etcjcSources[i]) !== -1) {
            jctype = 'etcjc';
            break;
        }
    }

// km jc
    const kmjcSources = [
        'v.youku.com'
    ];

    for (let i = 0; i < kmjcSources.length; i++) {
        if (player_data.url.indexOf(kmjcSources[i]) !== -1) {
            jctype = 'kmjc';
            break;
        }
    }

    if (jctype == 'normal') {
        if (player_data.url.startsWith("https")) {
            return jsonify({'urls': [player_data.url]})
        }
    } else if (jctype == 'JL4K' || jctype == 'JL2K' || jctype == 'JCC' || jctype == 'JLDJ') {
        //todo
        // JL / JCC 走 jlplayer.php
        // MacPlayer.Html = '<iframe border="0" allowfullscreen="true" src="//gimytv.app/jklplayer/index.php?url='
        //     + player_data.url + '&jctype=' + jctype + '&next=//' + maccms.url + parent.MacPlayer.PlayLinkNext
        //     + '" width="100%" height="' + MacPlayer.Height + '" frameborder="0" scrolling="no"></iframe>';
    } else if (jctype == 'djplayer') {
        //todo
        // const {data} = await $fetch.get(`${SITE}/jcplayer/cplayer.php?url=${player_data.url}&jctype=djplayer`, {
        //     headers
        // })
        // 錦鯉短劇專用 djplayer
        // MacPlayer.Html = '<iframe border="0" allowfullscreen="true" src="//gimytv.app/jcplayer/cplayer.php?url='
        //     + player_data.url + '&jctype=' + jctype + '&next=//' + maccms.url + '' + parent.MacPlayer.PlayLinkNext
        //     + '" height="' + MacPlayer.Height + '" width="100%" height="100%" marginWidth="0" frameSpacing="0" marginHeight="0" frameBorder="0" scrolling="no" vspale="0" ></iframe>';
    } else if (jctype == 'JK2' || jctype == 'Disney' || jctype == 'qingshan') {
        // JK2
        const {data} = await $fetch.get(`${appConfig.site}/jcplayer/?url=${player_data.url}&jctype=JK2`, {
            headers
        })
        const url = data.match(/playurl\s*=\s*['"]([^'"]+)['"]/)[1];
        return jsonify({'urls': [url]})
    } else {

        const body = `url=${player_data.url}`;

        const { data } = await $fetch.post(`${appConfig.site}/jcplayer/hp/api.php`, body,{headers:headers});

        let jmurl=parseJsonIfString(data).url

        let decrypted = CryptoJS.AES.decrypt(jmurl, CryptoJS.enc.Utf8.parse('ARTPLAYERliUlanG'),/*key16位*/ {
            iv: CryptoJS.enc.Utf8.parse('ArtplayerliUlanG'),/*iv16位*/
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        let url=decrypted.toString(CryptoJS.enc.Utf8)
        return jsonify({'urls': [url]})
    }

}
function parseJsonIfString(input) {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);  // 尝试将字符串解析为 JSON
        } catch (e) {
            console.error("Invalid JSON string", e);
            return null;  // 如果解析失败，返回 null 或其他错误处理
        }
    }
    return input;  // 如果输入是对象，直接返回
}
async function search(ext) {
    ext = argsify(ext)
    let cards = [];

    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1

    const url = appConfig.site + `/search/${text}----------${page}---.html`
    const {data} = await $fetch.get(url, {
        headers
    })

    const $ = cheerio.load(data)
    $("div#content>div.details-info-min").each((_, each) => {
        cards.push({
            vod_id: $(each).find("a.video-pic").attr("href"),
            vod_name: $(each).find("a.video-pic").attr("title").trim(),
            vod_pic: $(each).find("a.video-pic").data("original"),
            vod_remarks: $(each).find("ul.info li:first span").text().trim(),
            ext: {
                url: appConfig.site + $(each).find("a.video-pic").attr("href")
            }
        })

    })

    return jsonify({
        list: cards,
    })
}

function base64decode(str) {
    var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
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
