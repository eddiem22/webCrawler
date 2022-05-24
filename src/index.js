const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const urlParser = require('url');
const visitedURLS = {};

const getURL = async(link, host, protocol) => {
    if(link.includes("http")) return link;
    else if(link.startsWith("/")) return `${protocol}//${host}/${link}`;
    else return `${protocol}//${host}/${link}`;
};

const crawl = async({url, ignore}) => {
    try{
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
         getURL(imageURL, host, protocol).then((URL) => {
         fetch(URL).then((response) => {
            const filename = path.basename(imageURL)
            const dest = fs.createWriteStream(`images/${filename}`)
            response.body.pipe(dest)
        });
        })
    }); 

    links.filter((link) => link.includes(host) && !link.includes(ignore))
    .forEach(async(link) => {
        await getURL(link, host, protocol).then((URL) => {
         crawl({url: URL,
            //ignore,
        })})
    });
}
catch(e){}
}



crawl({
    url: "https://www.youtube.com/",
    ignore: '/search',
})