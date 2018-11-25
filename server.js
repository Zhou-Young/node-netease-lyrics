const http = require('http')
const fs = require('fs')
const cheerio = require('cheerio')
const axios = require('axios');
var url = require('url');
const nodejieba = require('nodejieba');

function wordCluod(){
  fs.readFile('geci.txt', 'utf8', function(err, data){
    // jieba分词 [{word:'word',weight:'100'},{}]
    const result = nodejieba.extract(data, 100);
    // 过滤关键词  英文要大写
    const tagList = ['作曲', '作词', 'MAJ7', '\n'];
    let textNo = JSON.stringify(result.filter(item => tagList.indexOf(item.word.toUpperCase()) < 0));
    let text = JSON.parse(textNo);
    let words = [];
    // 将分词格式处理一下
    for (let i=0;i<text.length;i++){
      words[i]={
        word: text[i].word,
        size: Math.floor(text[i].weight/30)
      }
    }
    words = JSON.stringify(words);
    // console.log(words);
    // 存到json数组
    fs.writeFile('word.json',words,function(err){
      if(err){
        return console.log('5',err)
      }
    })
  });
}

function filterList(html) {
  fs.writeFile('aa.html',html,function(err){
    if(err){
      return console.log('4',err)
    }
  })
  // 用cheerio方便的提取节点信息
  const $ = cheerio.load(html, {
    ignoreWhitespace: true,
    xmlMode: true
  })
  let listHtml = [];
  let listId=[];  // 歌单id
  let listName = [];  // 歌单名字
  let lyric=[];  //歌词

  const listLength = String($('.f-hide','#song-list-pre-cache').find('li').length)

  for(let i=0;i<listLength;i++){
    listHtml[i] = $('.f-hide','#song-list-pre-cache').find('li').eq(i).html()
    listId[i] = $('.f-hide','#song-list-pre-cache').find('a').eq(i).attr('href')
    listId[i] = listId[i].slice(6);
    listName[i] = $('.f-hide','#song-list-pre-cache').find('a').eq(i).text()
    // 根据
    axios.get('http://music.163.com/api/song/lyric?'+ listId[i] + '&lv=1&kv=1&tv=-1').then(response => {
      var lrc=[]
      lrc = response.data.lrc.lyric.split('\n');
      for(let i=0;i<lrc.length;i++){
        lrc[i] = lrc[i].slice(11);
      }
      lyric[i] = listName[i]+' '+lrc.join(' ');
      fs.writeFile('geci.txt',lyric[i]+'\n',{ 'flag': 'a' },function(err){
        if(err){
          return console.log('3',err)
        }
      })
    });
  }
  // listHtmlStr = listHtml.join('<br/>');

  // 这个接口是异步的，要跑两次才能拿到值
  wordCluod();

}

// 用axios爬取歌单信息，并保存其html界面
// 用http.get 和request都只能爬到一首歌，不知道为什么
axios.get('https://music.163.com/playlist?id=443357053')
  .then(response => {
    const html=response.data;
    filterList(html);
  })
  .catch(error => {
    console.log('1',error);
  });

  http.createServer(function (request, response) {
     var pathname = url.parse(request.url).pathname;
     // 输出请求的文件名
      console.log('Request for ' + pathname + ' received.');
     // 从文件系统中读取请求的文件内容
      fs.readFile(pathname.substr(1), function (err, data) {
       if (err) {
          console.log('2',err);
         // HTTP 状态码: 404 : NOT FOUND
        //  Content Type: text/plain
          response.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
       }else{
         response.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
         // 响应文件内容
          response.write(data.toString());
       }
      //  发送响应数据
      response.end();
   });
  }).listen(8080);


console.log('Server running at http://127.0.0.1:8080/');