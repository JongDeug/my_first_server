// import http from 'http';
// import fs from 'fs';
// 모듈이 c언어에서 라이브러리 같은거구나
var http = require('http');
var fs = require('fs');
const path = require("path");
let qs = require('querystring');
let template = require('../lib/template.js');
const sanitizeHtml = require('sanitize-html');

var app = http.createServer(function (request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const queryData = url.searchParams;
    console.log('queryData :', queryData);
    let pathname = url.pathname;
    console.log('pathname : ', pathname);
    let title = queryData.get('id');
    // console.log(queryData.get('id'));
    // console.log(__dirname + url);

    if (pathname === '/') {
        if (title === null) {
            fs.readdir('../data/', function (err, filelist) {
                if (err) throw err;
                console.log(filelist);
                title = 'welcome';
                let description = 'hello, node.js';
                let list = template.list(filelist);
                let html = template.html(title, list,
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create</a>`);
                response.end(html);
                response.writeHead(200);
            })
        } else {
            fs.readdir('../data/', (error, filelist) => {
                var filteredid = path.parse(title).base;
                let list = template.list(filelist);
                // console.log(list);
                fs.readFile(`../data/${filteredid}`, 'utf8', function (err, description) {
                    const sanitizetitle = sanitizeHtml(title);
                    const sanitizedescription = sanitizeHtml(description, {
                        allowedTags:['h1']
                    });
                    let html = template.html(title, list,
                        `<h2>${sanitizetitle}</h2>${sanitizedescription}`,
                        `<a href="/create">create</a> 
                        <a href="/update?id=${sanitizetitle}">update</a> 
                        <form action="/delete_process" method="post">
                            <input type="hidden" name="id" value="${sanitizetitle}">
                            <input type="submit" value="delete">
                        </form>
                        `);
                    response.end(html);
                    response.writeHead(200);
                });
            });
        }
    }
    else if (pathname === '/create') {
        fs.readdir('../data/', function (err, filelist) {
            title = 'web - create';
            let list = template.list(filelist);
            let html = template.html(title, list, `
                <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                <form>
            `, '');
            response.writeHead(200);
            response.end(html);
        })
    }
    else if (pathname === '/create_process') {
        let body = '';
        request.on('data', function (data) {
            // console.log(data);
            body += data;
        });
        request.on('end', function () {
            let post = qs.parse(body);
            // console.log(post);
            let title = post.title;
            let description = post.description;

            fs.writeFile(`../data/${title}`, description, 'utf-8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
                // redirection
                response.writeHead(302, { Location: encodeURI(`/?id=${title}`) });
                response.end();
            })
        });

    }
    else if (pathname === '/update') {
        fs.readdir('../data/', (error, filelist) => {
            var filteredId = path.parse(title).base;
            fs.readFile(`../data/${filteredId}`, 'utf8', function (err, description) {
                let list = template.list(filelist);
                let html = template.html(title, list,
                    `
                    <form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${title}">
                    <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                    <p>
                        <textarea name="description" placeholder="description">${description}</textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                    <form>
                    `,
                    `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
                response.end(html);
                response.writeHead(200);
            });
        });
    }
    else if (pathname === '/update_process') {
        let body = '';
        request.on('data', function (data) {
            // console.log(data);
            body += data;
        });
        request.on('end', function () {
            let post = qs.parse(body);
            console.log(post);
            console.log(path.parse(post.id).base);
            let id = path.parse(post.id).base;
            let title = path.parse(post.title).base;
            let description = post.description;

            fs.rename(`../data/${id}`, `../data/${title}`, function (err) {
                if (err) {
                    response.end('fuck you');
                    return;
                }
                console.log('File Renamed');
                fs.writeFile(`../data/${title}`, description, 'utf-8', (err) => {
                    if (err) throw err;
                    // console.log(title);
                    console.log('The file has been saved!');
                    response.writeHead(302, { Location: encodeURI(`/?id=${title}`) });
                    response.end();
                })
            });
        });
    }
    else if (pathname === '/delete_process') {
        let body = '';
        request.on('data', function (data) {
            console.log(data);
            body += data;
        })
        request.on('end', function (end) {
            // console.log(body);
            let post = qs.parse(body);
            // console.log(post);
            let id = post.id;
            var filteredId = path.parse(title).base;
            fs.unlink(`../data/${filteredId}`, function (err) {
                if (err) throw err;
                console.log('File deleted');
                response.writeHead(302, { Location: encodeURI(`/`) });
                response.end();
            })
        })
    }
    else {
        response.writeHead(404);
        response.end('Not found');
    }

    // response.end(fs.readFileSync(__dirname + url));
});
app.listen(3000);
