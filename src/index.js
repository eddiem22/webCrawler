const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const urlParser = require('url');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const visitedURLS = {};

const getURL = (link, host, protocol) => {
    if(link.includes("http")) return link;
    else if(link.startsWith("/")) return `${protocol}//${host}/${link}`;
    else return `${protocol}//${host}/${link}`;
};

const crawl = async({url, ignore}) => {
    if(visitedURLS[url]) return;
    console.log("crawing page: ", url);
    visitedURLS[url]  = true;

    const {host, protocol} = urlParser.parse(url);

    const response = await fetch(`${url}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();

    const imageLinks = $("img")
    .map((i, link) => link.attribs.src)
    .get();

    imageLinks.forEach((imageURL) => {
        fetch(getURL(imageURL, host, protocol)).then((response) => {
            const filename = path.basename(imageURL)
            const dest = fs.createWriteStream(`images/${filename}`)
            response.body.pipe(dest)
        });
    }); 

    links.filter((link) => link.includes(host) && !link.includes(ignore))
    .forEach((link) => {
        crawl({url: getURL(link, host, protocol), 
            ignore,
        });
    });
};


crawl({
    url: "https://www.amazon.com/",
    ignore: "/search",
});