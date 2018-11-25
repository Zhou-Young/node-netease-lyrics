# 基于nodejs的网易云歌词爬取并生成词云

温馨提示：
代码十分ugly  ，  观看请闭眼

1、搭建node服务器

2、用axios爬取网易云歌单界面
（用http和request都只能爬到第一首歌，，不知道是我操作问题还是什么，暂无深究）

用cheerio快捷获取节点：https://github.com/cheeriojs/cheerio  https://www.jianshu.com/p/629a81b4e013

```
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
});
```

3、根据歌曲id爬取歌词

直接根据 Request URL: https://music.163.com/song?id=1311319058 并不能爬取到信息  
然后看到歌词信息是放在 Request URL: https://music.163.com/weapi/song/lyric?csrf_token= 里面的  
但是这个接口需要传递  {  params: , encSecKey: }这两个参数  
可是这两个参数需要加密  
怎么办呢  

**用这个接口就可以了**：
'http://music.163.com/api/song/lyric?' + 'id=' + String(191232) + '&lv=1&kv=1&tv=-1'

4、解析出歌词，用jieba对其进行分词

jieba分词：https://github.com/fxsjy/jieba

```
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
        size: Math.floor(text[i].weight/10)
      }
    }
    words = JSON.stringify(words);
    // 存到json数组
    fs.writeFile('word.json',words,function(err){
      if(err){
        return console.log(err)
      }
    })
  });
}
```

5、生成词云

d3-cloud词云：https://github.com/jasondavies/d3-cloud  https://github.com/lilongsy/d3

本文将分词数据存做json文件，在网页获取并展示词云

```
<script src="https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js"></script>
<script src="./d3/wordcloud/d3.js"></script>
<script src="./d3/wordcloud/build/d3.layout.cloud.js"></script>

$(function () {
  $.ajax({
    type: "get",
    url: "word.json",
    dataType: "json",
    async: false,
    success: function (data) {
      var words = data;

      // d3-cloud 词云
      var fill = d3.scale.category20();
      var layout = d3.layout.cloud()
        .size([500, 500])
        .words(words)
        .padding(1)
        .rotate(function () {
          return ~~(Math.random() * 2) * 90;
        })
        .font("Impact")
        .fontSize(function (d) {
          return d.size;
        })
        .on("end", draw);

      layout.start();

      function draw(words) {
        d3.select("#wrap").append("svg")
          .attr("width", layout.size()[0])
          .attr("height", layout.size()[1])
          .append("g")
          .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
          .selectAll("text")
          .data(words)
          .enter().append("text")
          .style("font-size", function (d) {
            return d.size + "px";
          })
          .style("font-family", "Impact")
          .style("fill", function (d, i) {
            return fill(i);
          })
          .attr("text-anchor", "middle")
          .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function (d) {
            return d.word;
          });
      }
    }
  });
})
```


附录：

1、nodejs常用发请求方式: https://segmentfault.com/a/1190000010698468

HTTP - 标准库

```
const https = require('https');
 
https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (resp) => {
  let data = '';
 
  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });
 
  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    console.log(JSON.parse(data).explanation);
  });
 
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
```

Request

```
const request = require('request');
 
request('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', { json: true }, (err, res, body) => {
  if (err) { return console.log(err); }
  console.log(body.url);
  console.log(body.explanation);
});
```

Axios

```
const axios = require('axios');
 
axios.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
  .then(response => {
    console.log(response.data.url);
    console.log(response.data.explanation);
  })
  .catch(error => {
    console.log(error);
  });
```

2、将数据作为Form Data传递

```
  axios({
    method: 'post',
    url: 'https://music.163.com/weapi/song/lyric?csrf_token=',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: {
      params: 'U17lZhIIMNo/+92rbP7W69Mbm9+gElyaAyZ4v4degjAyywvE9M0bM4z77eds9+v7oYoj6drqDV2diP3P0YPZ41MNtl4TROPhjDnaYkENvgNlt6GnQZHZfoXg+4/IYIZd',
      encSecKey: '71bcec5f2a053f3f42e86bf4ea91e66092276cad12d6514a825449a38fb124498e6d177ffef3e4421061c679bf9112910d70374a3ff83d00062117af3d1b0761f4140d19d34f656ab2319804e0e18cd293545aee47f8595605285ad3cdfc50c857e7545194bf75140bcf60ed99e7f5f02a5b7d9bd3cba1732411ea312a344066'
    },
    transformRequest: [function (data) {
      let ret = ''
      for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
      }
      return ret
    }]
  }).then(response => {
    })
  });
```




