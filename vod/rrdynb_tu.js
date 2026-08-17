const cheerio = createCheerio()
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const appConfig = {
    ver: 2,
    title: '人人电影网',
    site: 'https://www.rrdynb.com',
    tabs: [
        {
            name: '电影',
            ext: { id: 'movie' },
        },
        {
            name: '电视剧',
            ext: { id: 'dianshiju' },
        },
        {
            name: '老电影',
            ext: { id: 'zongyi' },
        },
        {
            name: '动漫',
            ext: { id: 'dongman' },
        },
    ],
}

// 清洗标题：去除《》及后面的网盘下载后缀
function cleanTitle(title) {
    if (!title) return ''
    return title
        .replace(/^《/, '')
        .replace(/》.*$/, '')
        .replace(/百度云网盘.*$/, '')
        .replace(/夸克下载.*$/, '')
        .replace(/阿里云盘.*$/, '')
        .replace(/\.?\(?\d{4}\)?\.?$/, '')
        .trim()
}

// 拼接完整 URL
function fullUrl(href) {
    if (!href) return ''
    if (href.startsWith('http')) return href
    return appConfig.site + (href.startsWith('/') ? href : '/' + href)
}

// 网盘域名匹配
const PAN_DOMAINS = [
    'pan.quark.cn',
    'pan.baidu.com',
    'pan.xunlei.com',
    'alipan.com',
    'aliyundrive.com',
    'www.aliyundrive.com',
    'drive.uc.cn',
    'www.123pan.com',
    '123pan.com',
    'cloud.189.cn',
]

function isPanLink(href) {
    if (!href) return false
    return PAN_DOMAINS.some((d) => href.includes(d))
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCards(ext) {
    ext = argsify(ext)
    let cards = []
    const { page = 1, id } = ext
    const url = `${appConfig.site}/${id}/?page=${page}`

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA },
    })
    const $ = cheerio.load(data)

    const videos = $('#movielist > li')
    videos.each((_, e) => {
        const $el = $(e)
        const href = $el.find('.movie-thumbnails').attr('href') || ''
        const $img = $el.find('img.pure-img')
        const cover = $img.attr('data-original') || $img.attr('src') || ''
        const rawTitle = $img.attr('alt') || $el.find('.intro h2 a').attr('title') || ''
        const brief = $el.find('.brief').text().trim()
        const date = $el.find('.tags').text().trim()

        const remarks = (date ? date + '  ' : '') + brief.substring(0, 60)

        if (href && rawTitle) {
            cards.push({
                vod_id: href,
                vod_name: cleanTitle(rawTitle),
                vod_pic: fullUrl(cover),
                vod_remarks: remarks,
                ext: { url: fullUrl(href) },
            })
        }
    })

    return jsonify({ list: cards })
}

async function getTracks(ext) {
    ext = argsify(ext)
    let tracks = []
    const url = ext.url

    const { data } = await $fetch.get(url, {
        headers: { 'User-Agent': UA },
    })
    const $ = cheerio.load(data)

    // 优先从 movie-txt 区域提取
    const $txt = $('.movie-txt')
    const links = $txt.find('a')
    links.each((_, e) => {
        const $a = $(e)
        const href = $a.attr('href') || ''
        const name = $a.text().trim()
        if (isPanLink(href)) {
            tracks.push({
                name: name || '网盘资源',
                pan: href,
            })
        }
    })

    // 兜底：从 movie-txt HTML 中正则匹配网盘链接
    if (tracks.length === 0) {
        const html = $txt.html() || ''
        const panRegex = /https?:\/\/[^\s"'<>]+/g
        let match
        while ((match = panRegex.exec(html)) !== null) {
            if (isPanLink(match[0])) {
                tracks.push({ name: '网盘资源', pan: match[0] })
            }
        }
    }

    // 去重
    const seen = new Set()
    tracks = tracks.filter((t) => {
        if (seen.has(t.pan)) return false
        seen.add(t.pan)
        return true
    })

    return jsonify({
        list: [
            {
                title: '默认分组',
                tracks,
            },
        ],
    })
}

async function getPlayinfo(ext) {
    return jsonify({ urls: [] })
}

async function search(ext) {
    ext = argsify(ext)
    let cards = []
    const text = encodeURIComponent(ext.text)
    const page = ext.page || 1
    const url = `${appConfig.site}/plus/search.php?q=${text}&page=${page}`

    try {
        const { data } = await $fetch.get(url, {
            headers: { 'User-Agent': UA },
        })
        const $ = cheerio.load(data)

        const videos = $('#movielist > li, .list li')
        videos.each((_, e) => {
            const $el = $(e)
            const href = $el.find('.movie-thumbnails, a[href$=".html"]').attr('href') || ''
            const $img = $el.find('img')
            const cover = $img.attr('data-original') || $img.attr('src') || ''
            const rawTitle =
                $img.attr('alt') ||
                $el.find('.intro h2 a').attr('title') ||
                $el.find('.intro h2 a').text().trim() ||
                ''

            if (href && rawTitle) {
                cards.push({
                    vod_id: href,
                    vod_name: cleanTitle(rawTitle),
                    vod_pic: fullUrl(cover),
                    vod_remarks: '',
                    ext: { url: fullUrl(href) },
                })
            }
        })
    } catch (e) {
        // 搜索不可用时静默返回空
    }

    return jsonify({ list: cards })
}
