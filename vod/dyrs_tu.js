//域名发布页dyrs.net
const cheerio = createCheerio()
let $config = argsify($config_str)
const SITE =$config.site || "https://www.dyrsvip.de"
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const headers = {
    'Referer': `${SITE}/`,
    'Origin': `${SITE}`,
    'User-Agent': UA,
}

const appConfig = {
    ver: 1,
    title: "电影人生",
    site: SITE,
    tabs: [{
        name: '电影',
        ext: {
            url: `${SITE}/dianying.html?page={page}&sort_field=play_hot`
        },
    },{
        name: '电视剧',
        ext: {
            url: `${SITE}/dianshiju.html?page={page}&sort_field=play_hot`
        },
    },{
        name: '综艺',
        ext: {
            url: `${SITE}/zongyi.html?page={page}&sort_field=play_hot`
        },
    },{
        name: '动漫',
        ext: {
            url: `${SITE}/dongman.html?page={page}&sort_field=play_hot`
        },
    },{
        name: '短剧',
        ext: {
            url: `${SITE}/duanju.html?page={page}&sort_field=play_hot`
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
    url = url.replace('{page}', page-1)

    const { data } = await $fetch.get(url, {
        headers
    })
    const $ = cheerio.load(data)
    $("#image-grid").find('#image-grid > div.relative.group').each((_, each) => {
        const a = $(each).find('a')
        const img = a.find('img')

        let pic = img.attr("data-src") || img.attr("src")

        if (pic && pic.startsWith('/')) {
            pic = appConfig.site + pic
        }

        cards.push({
            vod_id: a.attr("href"),
            vod_name: $(each).find('h3').text().trim(),
            vod_pic: pic,
            vod_remarks: a.find('div.absolute.top-2').text().trim(),
            ext: {
                url: appConfig.site +a.attr("href"),
            },
        })
    })

    return jsonify({
        list: cards,
    });
}

async function getTracks(ext) {
    ext = argsify(ext)
    const url = ext.url

    const { data } = await $fetch.get(url, { headers })
    const $ = cheerio.load(data)

    const $list = $('#originTabs a')

    $utils.toastInfo("正在获取线路...")
    const groups = await Promise.all(
        $list.map((_, each) => {
            const lineName = $(each).find('button')
                .clone()
                .children().remove()
                .end()
                .text()
                .trim()

            const href = $(each).attr('href')
            const fullUrl = appConfig.site + href

            // 👉 返回 Promise
            return $fetch.get(fullUrl, { headers }).then(({ data }) => {
                const $$ = cheerio.load(data)

                let $ele = $$("#episodeContent div.grid > a")
                if (!$ele.length) {
                    $ele = $$("#episodeContent div.items-center > a")
                }

                const tracks = []

                $ele.each((_, el) => {
                    const a = $$(el)

                    const epName =
                        a.attr('data-title') ||
                        a.find("button").text().trim()

                    const epHref = a.attr('href')

                    tracks.push({
                        name: epName,
                        pan: '',
                        ext: {
                            url: appConfig.site + epHref
                        }
                    })
                })

                return {
                    title: lineName,
                    tracks
                }
            })
        }).get()
    )

    return jsonify({ list: groups })
}
async function getPlayinfo(ext) {
    ext = argsify(ext)
    let url = ext.url
    const { data } = await $fetch.get(url, {
        headers
    })
    const $ = cheerio.load(data)
    let preload=appConfig.site+ $('link[rel="preload"]').attr('href')
    return jsonify({ 'urls': [preload] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    let text = encodeURIComponent(ext.text)
    let page = ext.page || 1
    const { data } = await $fetch.get(`${appConfig.site}/s.html?name=${text}&page=${page-1}&sort_field=_id`, {
        headers
    })
    //$print(argsify(data))
    const $=cheerio.load(data)
    $("#image-grid").find('#image-grid > div.relative.group').each((_, each) => {
        const a = $(each).find('a')
        const img = a.find('img')

        let pic = img.attr("data-src") || img.attr("src")
        if (pic && pic.startsWith('/')) {
            pic = appConfig.site + pic
        }
        cards.push({
            vod_id: a.attr("href"),
            vod_name: $(each).find('h3').text().trim(),
            vod_pic: pic,
            vod_remarks: a.find('div.absolute.top-2').text().trim(),
            ext: {
                url: appConfig.site +a.attr("href"),
            },
        })
    })
    return jsonify({
        list: cards,
    })
}
