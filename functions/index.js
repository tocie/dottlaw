'use strict';

// console.log("result===============" + JSON.stringify(result));

process.env.DEBUG = 'actions-on-google:*';
const DialogflowApp = require('actions-on-google').DialogflowApp;
let fetch = require('node-fetch');

// Xml -> Json
let jsonParser = require('xml2json');
let xml2js = require('xml2js');
let parser = new xml2js.Parser();

let lawbooks = ['憲法', '民法', '刑法', '民事訴訟法', '刑事訴訟法', '会社法', 'すべての法典を確認する']
let fullLawbooks = ['憲法', '民法', '刑法', '民事訴訟法', '刑事訴訟法', '商法', '会社法', '著作権法', "地方自治法", "行政手続法", "行政代執行法", "行政不服審査法", "行政事件訴訟法", "国家賠償法", "国家公務員法", "地方公務員法", "借地借家法", "会社法施行規則", "会社計算規則", "手形法", "小切手法", "民事執行法", "民事保全法", "少年法", "労働契約法", "労働基準法", "労働組合法", "労働関係調整法", "生活保護法", "独占禁止法", "下請法", "不正競争防止法", "金融商品取引法", "特許法", "商標法", "意匠法", "実用新案法", "自動車損害賠償保障法", "医師法" ]

// For GCP
//exports.dottlaw = (request, response) => {

// For Firebase
const functions = require('firebase-functions');
exports.dottlaw = functions.https.onRequest((request, response) => {
    const app = new DialogflowApp({
        request,
        response
    });

    function welcomeIntent(app) {
        if (app.getLastSeen()) {
            // 二回目以降.
            app.ask(app.buildRichResponse()
            .addSimpleResponse({
                speech: "まいど！法典名と条文番号を教えてください。",
                displayText: "毎度！ボイス六法です。法典名📖と条文番号を教えてください。"
            })
            .addSuggestions(lawbooks)
            );
        } else {
            // First Time invoke app.
            app.ask(app.buildRichResponse()
            .addSimpleResponse({
                speech: "こんにちは！はじめまして。ボイス六法です。このアプリはあなたの代わりに六法をお調べします。六法と条文番号を教えてください。",
                displayText: "こんにちは！はじめまして。ボイス六法です。📖このアプリはあなたの代わりに六法をお調べします。六法と条文番号を教えてください。"
            })
            .addSuggestions(lawbooks)
            );
        }

    }
    function getArticleYes(app){
        app.ask(app.buildRichResponse()
        .addSimpleResponse({
            speech: "それでは法典名と条文番号を教えてください。",
            displayText: "それでは法典名📖と条文番号を教えてください。"
        })
        .addSuggestions(fullLawbooks)
        );
    }
    function getList(app){
        let bookList = fullLawbooks.join(", ");

        app.ask(app.buildRichResponse()
        .addSimpleResponse({
            speech: "ご利用いただける法典は" + bookList + "です。調べたい法典名を教えてください。",
            displayText: "ご利用いただける法典は " + bookList + " です。📖 \n調べたい法典名を教えてください。",
        })
        .addSuggestions(fullLawbooks)
        );
    }
    function get_article_number (app) {
        // 法典取得
        const getCodeLaw = app.getArgument('code_law');

        // 条文番号取得
        const articleNum = app.getArgument('article_number');
        const paragraphNum = app.getArgument('paragraph_number');

        // API URLを取得
        let apiInfo = getLawApi( getCodeLaw, articleNum, paragraphNum );
        
        // LawContentsを取得
        parseLaw(apiInfo)
    }


    // Snipets
    // 法典名条件分岐
    function getLawApi( getCodeLaw, articleNum, paragraphNum ){
        let lawName = getCodeLaw;
        let codeLaw;
        if(getCodeLaw == '憲法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%80%E5%B9%B4%E6%86%B2%E6%B3%95";
        }else if(getCodeLaw == '民法'){
            codeLaw = "%E6%98%8E%E6%B2%BB%E4%BA%8C%E5%8D%81%E4%B9%9D%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%85%AB%E5%8D%81%E4%B9%9D%E5%8F%B7";
        }else if(getCodeLaw == '刑法'){
            codeLaw = "%E6%98%8E%E6%B2%BB%E5%9B%9B%E5%8D%81%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8D%81%E4%BA%94%E5%8F%B7";
        }else if(getCodeLaw == '民事訴訟法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E5%85%AB%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%B9%9D%E5%8F%B7";
        }else if(getCodeLaw == '刑事訴訟法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%89%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%B8%89%E5%8D%81%E4%B8%80%E5%8F%B7";
        }else if(getCodeLaw == '商法'){
            codeLaw = "%E6%98%8E%E6%B2%BB%E4%B8%89%E5%8D%81%E4%BA%8C%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8D%81%E5%85%AB%E5%8F%B7";
        }else if(getCodeLaw == '会社法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E5%8D%81%E4%B8%83%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%85%AB%E5%8D%81%E5%85%AD%E5%8F%B7";
        }else if(getCodeLaw == '労働基準法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%8C%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8D%81%E4%B9%9D%E5%8F%B7"
        }else if(getCodeLaw == '著作権法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E5%9B%9B%E5%8D%81%E4%BA%94%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8D%81%E5%85%AB%E5%8F%B7"
        }else if(getCodeLaw == '地方自治法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%8C%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%85%AD%E5%8D%81%E4%B8%83%E5%8F%B7"
        }else if(getCodeLaw == '行政手続法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E4%BA%94%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%85%AB%E5%8D%81%E5%85%AB%E5%8F%B7"
        }else if(getCodeLaw == '行政代執行法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%89%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8D%81%E4%B8%89%E5%8F%B7"
        }else if(getCodeLaw == '行政不服審査法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E4%BA%8C%E5%8D%81%E5%85%AD%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%85%AD%E5%8D%81%E5%85%AB%E5%8F%B7"
        }else if(getCodeLaw == '行政事件訴訟法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E4%B8%83%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%B8%89%E5%8D%81%E4%B9%9D%E5%8F%B7"
        }else if(getCodeLaw == '国家賠償法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%8C%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E4%BA%94%E5%8F%B7"
        }else if(getCodeLaw == '国家公務員法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%8C%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E5%8F%B7"
        }else if(getCodeLaw == '地方公務員法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%94%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%8C%E7%99%BE%E5%85%AD%E5%8D%81%E4%B8%80%E5%8F%B7"
        }else if(getCodeLaw == '借地借家法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E4%B8%89%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%B9%9D%E5%8D%81%E5%8F%B7"
        }else if(getCodeLaw == '会社法施行規則'){
            codeLaw = "%E5%B9%B3%E6%88%90%E5%8D%81%E5%85%AB%E5%B9%B4%E6%B3%95%E5%8B%99%E7%9C%81%E4%BB%A4%E7%AC%AC%E5%8D%81%E4%BA%8C%E5%8F%B7"
        }else if(getCodeLaw == '会社計算規則'){
            codeLaw = "%E5%B9%B3%E6%88%90%E5%8D%81%E5%85%AB%E5%B9%B4%E6%B3%95%E5%8B%99%E7%9C%81%E4%BB%A4%E7%AC%AC%E5%8D%81%E4%B8%89%E5%8F%B7"
        }else if(getCodeLaw == '手形法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%83%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%8C%E5%8D%81%E5%8F%B7"
        }else if(getCodeLaw == '小切手法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E5%85%AB%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%94%E5%8D%81%E4%B8%83%E5%8F%B7"
        }else if(getCodeLaw == '民事執行法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%94%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8F%B7"
        }else if(getCodeLaw == '民事保全法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E5%85%83%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%B9%9D%E5%8D%81%E4%B8%80%E5%8F%B7"
        }else if(getCodeLaw == '少年法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%89%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E5%85%AD%E5%8D%81%E5%85%AB%E5%8F%B7"
        }else if(getCodeLaw == '労働契約法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E5%8D%81%E4%B9%9D%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E5%85%AB%E5%8F%B7"
        }else if(getCodeLaw == '労働組合法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%B8%83%E5%8D%81%E5%9B%9B%E5%8F%B7"
        }else if(getCodeLaw == '労働関係調整法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%80%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%8C%E5%8D%81%E4%BA%94%E5%8F%B7"
        }else if(getCodeLaw == '生活保護法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%94%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E5%9B%9B%E5%8D%81%E5%9B%9B%E5%8F%B7"
        }else if(getCodeLaw == '独占禁止法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%BA%8C%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%94%E5%8D%81%E5%9B%9B%E5%8F%B7"
        }else if(getCodeLaw == '下請法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E4%B8%80%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E5%8F%B7"
        }else if(getCodeLaw == '不正競争防止法'){
            codeLaw = "%E5%B9%B3%E6%88%90%E4%BA%94%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E5%9B%9B%E5%8D%81%E4%B8%83%E5%8F%B7"
        }else if(getCodeLaw == '金融商品取引法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%89%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%8C%E5%8D%81%E4%BA%94%E5%8F%B7"
        }else if(getCodeLaw == '特許法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E4%B8%80%E5%8F%B7"
        }else if(getCodeLaw == '商標法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E4%B8%83%E5%8F%B7"
        }else if(getCodeLaw == '意匠法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E4%BA%94%E5%8F%B7"
        }else if(getCodeLaw == '実用新案法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E5%9B%9B%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E7%99%BE%E4%BA%8C%E5%8D%81%E4%B8%89%E5%8F%B7"
        }else if(getCodeLaw == '医師法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%BA%8C%E5%8D%81%E4%B8%89%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%BA%8C%E7%99%BE%E4%B8%80%E5%8F%B7"
        }else if(getCodeLaw == '自動車損害賠償保障法'){
            codeLaw = "%E6%98%AD%E5%92%8C%E4%B8%89%E5%8D%81%E5%B9%B4%E6%B3%95%E5%BE%8B%E7%AC%AC%E4%B9%9D%E5%8D%81%E4%B8%83%E5%8F%B7"
        }else{
            codeLaw = "ほげほげ"
            lawName = "ほげほげ"
        }

        // }else if(getCodeLaw == ''){
        //     codeLaw = ""
        // }


          let apiUrl
            if( paragraphNum == null ){
                apiUrl = "http://elaws.e-gov.go.jp/api/1/articles;lawNum=" + codeLaw + ";article=" + articleNum;
            }else{
                apiUrl = "http://elaws.e-gov.go.jp/api/1/articles;lawNum=" + codeLaw + ";article=" + articleNum + ";paragraph=" + paragraphNum;
            }
          let apiInfo = {
            apiUrl: apiUrl,
            lawName: lawName,
            articleNum: articleNum,
            paragraphNum: paragraphNum
          }
          console.log("apiInfo==> " + JSON.stringify(paragraphNum));
          return apiInfo;
      }


    // LawContents 取得
    function parseLaw(apiInfo){
        let apiUrl = apiInfo.apiUrl
        let lawName = apiInfo.lawName
        let articleNum = parseInt(apiInfo.articleNum)
        let paragraphNum = parseInt(apiInfo.paragraphNum)

    fetch(apiUrl)
        .then(function(res) {return res.text();})
        .then(function(body) {
            let result;
            parser.parseString(body, function (err, parsedBody) {
                result = parsedBody;
            });
                //条文の有無の処理
                if(result.DataRoot.Result[0].Code[0] == 0){
                    //条文がある場合
                        result = result.DataRoot.ApplData[0].LawContents[0];

                        // 条文
                        let article = result;
                        if( !paragraphNum ){
                            // 項入力がなかった場合
                            article = result.Article[0];
                        }

                        // 項の数
                        let lengthLawParagraph = article.Paragraph.length;
                        // 現在の項の数
                        let currentParagraph = article.Paragraph;


                        let sTipBox = [];

                        // Suggestion Tips
                        // 前後の法典用
                        let articleNumMinus = parseInt(articleNum) - parseInt(1);
                        let articleNumPlus = parseInt(articleNum) + parseInt(1);
                        let previousArticle;
                        let nextArticle =  lawName + articleNumPlus + "条";

                        // 条文番号が1の場合
                        // 前の条文番号が0なので
                        // nullを返す
                        if(articleNumMinus == 0){
                            previousArticle = null;
                        }else{
                            previousArticle = lawName + articleNumMinus + "条";
                        }
                        sTipBox = [previousArticle, nextArticle, "はい", "いいえ"]
 
                        // 項がある場合、SuggestionTipsに出力する
                        if(lengthLawParagraph > 1){
                            sTipBox = [previousArticle];
                            for( let i=1; i < lengthLawParagraph+1; i++){
                                // 例 : 刑法 123条 4項
                                let articleName = lawName + articleNum + "条" + i + "項"
                                sTipBox.push(articleName);
                            }
                            sTipBox.push(nextArticle, "はい", "いいえ");
                        }

                        // 条文文言
                        // 刑法二条 
                        let LawSentence = parseLawSentence(article, paragraphNum);
                        app.ask(app.buildRichResponse()
                        .addSimpleResponse({
                            speech:  LawSentence + '条文は以上です。続けますか？',
                            displayText: LawSentence + '\n\n\n条文は以上です。続けてお調べしますか？🔍'
                        })
                        .addSuggestions(sTipBox)
                        );

                }else{
                    // 条文がない場合
                    //「取得条件に指定した条、項、別表に該当する条文内容が存在しません。」
                    app.ask(app.buildRichResponse()
                    .addSimpleResponse({
                        speech: result.DataRoot.Result[0].Message[0] + "再度検索してください。",
                        displayText: result.DataRoot.Result[0].Message[0] + '\n\n再度検索してください。🔎'
                    })
                    .addSuggestions(lawbooks)
                    );
                }   
            //}); End parseString
        })
    .catch(
        error => console.error('Error:', error)
    );
    }

    // 条文出力
    function parseLawSentence(result, paragraphNumber){
        let article = result;
        let paragraphNum = paragraphNumber;
        let articleSentence;


        if( !paragraphNum ){
            // 項入力がない場合
            // Paragraphにオブジェクトを持つ
            let articleSentence = article.Paragraph[0].ParagraphSentence[0];
            articleSentence = parseSentence(articleSentence)

            return articleSentence
        }else{
            // 項入力がある場合
            // Paragraphにオブジェクトを持たない
            let articleSentence = article.Paragraph[0].ParagraphSentence[0];
            articleSentence = parseSentence(articleSentence)
                
            return articleSentence

        }
    }
    function parseSentence(sentence){
        sentence = sentence.Sentence;
        let sentenceCaped = [];
         
        // 複数をすべて配列に入れる
        for( let i in sentence ){
            sentenceCaped.push(sentence[i]._)
            if(sentence[i]._ === undefined ){
                sentenceCaped.push(sentence[i])
            }
        }
     
        // 配列をすべて付け加える
        sentence = sentenceCaped.join("");
        return sentence
    }

    function fallback (app) {
      app.ask(app.buildRichResponse()
      .addSimpleResponse({
          speech: "法典名と条文番号を教えてください。よくわからない方は「ヘルプ」と言ってください。",
          displayText: "法典名📖と条文番号を教えてください。よくわからない方は「ヘルプ」と言ってください。"
      })
      .addSuggestions(lawbooks)
      );
    }  

    function noinput(app){

      if (app.getRepromptCount() === 0) {
            app.ask(app.buildRichResponse()
            .addSimpleResponse({
                speech: "無言ですか・・。法典名と条文番号を教えてください。よくわからない方は「ヘルプ」と言ってください。",
                displayText: "無言ですか・・。法典名と条文番号を教えてください。よくわからない方は「ヘルプ」と言ってください。"
            })
            .addSuggestions(lawbooks)
            );
        
      } else if (app.getRepromptCount() === 1) {
            app.ask(app.buildRichResponse()
            .addSimpleResponse({
                speech: "早くお答え下さい。さもないと爆発しちゃいます ....よ。",
                displayText: "早くお答え下さい。さもないと爆発しちゃいます。"
            })
            .addSuggestions(lawbooks)
            );
      } else if (app.isFinalReprompt()) {
        app.tell( "<speak><audio src='https://storage.googleapis.com/dottstrage/music.mp3'></audio>ご利用ありがとうございました</speak>" ); 
      } 
      
    }
  

    // Fire
    let actionMap = new Map();
    actionMap.set('welcomeIntent', welcomeIntent);
    actionMap.set('get_article_number', get_article_number);
    actionMap.set('getArticle.getArticle-yes', getArticleYes );
    actionMap.set('getList', getList);
    actionMap.set('input.unknown', fallback);
    actionMap.set('noinputIntent', noinput);
    app.handleRequest(actionMap);



});


