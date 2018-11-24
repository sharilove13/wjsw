(function(){
    var Util = (function(){
        //本地存储
        var prefix = "html5_wjsw_";
        var StorageGetter=function(key){
            return localStorage.getItem(prefix+key);	
        }
        var StorageSetter = function(key,val){
            return localStorage.setItem(prefix+key,val);
        }
        var getBJSONP = function(url,callback){
            //获取jsonp
            return $.jsonp({
                url:url,
                cache:true,
                callback:"duokan_fiction_chapter",
                success:function(result){
                    // debugger  //断点
                    var data = $.base64.decode(result);
                    var json = decodeURIComponent(escape(data));//解析
                    callback(json);
                }
            })
        }
        return {
            getBJSONP:getBJSONP,
            StorageGetter:StorageGetter,
            StorageSetter:StorageSetter
        }
    })();
    
    //定义常量
    var Win = $(window);
    var Doc = $(document);
    var Dom = {
        body_bk:$(".j-body-bk"),
        top_nav:$("#top_nav"),
        bottom_tools:$(".j-bottom-tools"),
        title_color:$(".m-read-content h4"),
        font_container:$(".j-font-container"),
        font_btn:$("#font_btn"),
        content_color:$(".m-read-content")
    }
    //数据交互模块
    var readerModel;
    //渲染模块
    var readerUI;

    //------------容器--------------------------
    var RootContainer = $("#fiction_continer");
    //从缓存中读取初始字体大小
    var initFontSize = Util.StorageGetter("font-size");
    initFontSize = parseInt(initFontSize);
    if(!initFontSize){
        initFontSize = 14;
    }
    RootContainer.css("font-size",initFontSize);
    //从缓存中读取初始背景色
    var initBackground = Util.StorageGetter("background-color");
    if(!initBackground){
        initBackground = "#e9dfc7";
    }
    Dom.body_bk.css("background-color",initBackground);   
    //从缓存中读取初始字体颜色
    var initFontColor = Util.StorageGetter("color");
    if(!initFontColor){
        initFontColor = "#555";
    }
    Dom.content_color.css("color",initFontColor);   

    //从缓存中读取初始字体颜色选中
    var selectedBk = Util.StorageGetter("selectedBk");
    if(!selectedBk){
        selectedBk="2";
    }
    $(".bk-container").html("");
    $(".j-bk"+selectedBk+"-container").html(`<div class="bk-container-current"></div>`);

    //从缓存中读取初始标题颜色
    var initTitleColor = Util.StorageGetter("title-color");
    if(!initTitleColor){
        initTitleColor = "#736357";
    }
    Dom.title_color.css("color",initTitleColor); 

    //-------------------入口函数-----------------------------------//


    function main(){
        //整个项目的入口函数
        readerModel = ReaderModel();
        readerUI = ReaderBaseFrame(RootContainer);
        readerModel.init(function(data){
            readerUI(data);
        });
        ReaderEventHandler();
    }
    //---------------------数据交互---------------------------------//


    function ReaderModel(){
        //实现和阅读器相关的数据交互方法
        var Chapter_id; //章节ID
        var ChapterTotal;   //总章节数
        var init = function(UIcallback){
            getFictionInfo(function(){
                //获取章节信息并回调
                getCurChapterContent(Chapter_id,function(data){
                    UIcallback&&UIcallback(data);
                });
            })
        }
        //获取章节信息
        var getFictionInfo = function(callback){
            $.get("../data/chapter.json",function(data){
                //获得章节信息后的函数操作
                Chapter_id = Util.StorageGetter("now_chapter_id");
                if(Chapter_id == null){
                    Chapter_id= data.chapters[1].chapter_id;
                }
                ChapterTotal = data.chapters.length;
                callback && callback();
            },"json");
        }
        //获取当前章节的内容
        var getCurChapterContent = function(chapter_id,callback){
            //获取获取的章节编号的不同，来获取不同章节的json内容
            $.get("../data/data"+chapter_id+".json",function(data){
                if(data.result == 0){
                    //响应成功获取到章节后，得到jsonp中的url
                    var url = data.jsonp;
                    Util.getBJSONP(url,function(data){
                        // debugger
                        callback && callback(data);
                    });
                }
            },"json")
        }
        // 获取上一章章节的id和数据
        var prevChapter = function(UIcallback){
            Chapter_id = parseInt(Chapter_id,10);
            if(Chapter_id == 0){
                return;
            }
            Chapter_id--;
            getCurChapterContent(Chapter_id,UIcallback);
            Util.StorageSetter("now_chapter_id",Chapter_id);
        }
        // 获取下一章章节的id和数据
        var nextChapter = function(UIcallback){
            Chapter_id = parseInt(Chapter_id,10);
            if(Chapter_id == ChapterTotal){
                return;
            }
            Chapter_id++;
            getCurChapterContent(Chapter_id,UIcallback);
            Util.StorageSetter("now_chapter_id",Chapter_id);
        }
        return {
            init:init,
            prevChapter:prevChapter,
            nextChapter:nextChapter
        }
    }
    //------------------------渲染UI------------------------------//


    function ReaderBaseFrame(container){
        //渲染基础UI结构 
        function parseChapterData(jsonData){
            //替换章节标题和内容的函数
            var jsonObj = JSON.parse(jsonData);
            var html = `<h4>${jsonObj.t}</h4>`;
            for(var i=0;i<jsonObj.p.length;i++){
                html += `<p>${jsonObj.p[i]}</p>`;
            }
            return html;
        }
        return function(data){
            //更改容器的某章节标题和内容
            container.html(parseChapterData(data));
        }
    }
    //------------------------交互事件绑定------------------------------//


    function ReaderEventHandler(){
        //交互事件绑定
        //触屏唤出上下边栏
        $("#action_mid").click(function(){
            if(Dom.top_nav.css("display") == "none"){
                Dom.top_nav.show();
                Dom.bottom_tools.show();
            }else{
                Dom.top_nav.hide();
                Dom.bottom_tools.hide();
                Dom.font_container.hide();
                Dom.font_btn.removeClass("current");
            }
        });
        //字体面板是否选中
        Dom.font_btn.click(function(){
            if(Dom.font_container.css("display") == "none"){
                Dom.font_container.show();
                Dom.font_btn.addClass("current");
            }else{
                Dom.font_container.hide();
                Dom.font_btn.removeClass("current");
            }
        });

        //字体的放大和缩小事件
        $("#zoomin_font").click(function(){
            if(initFontSize>20) return;
            initFontSize++;
            RootContainer.css("font-size",initFontSize);
            Util.StorageSetter("font-size",initFontSize);   //存储字号
        });
        $("#zoomout_font").click(function(){
            if(initFontSize<12) return;
            initFontSize--;
            RootContainer.css("font-size",initFontSize);
            Util.StorageSetter("font-size",initFontSize);
        });
        //背景切换事件
        $(".j-bk1-container").click(function(){
            // 背景
            initBackground=$(".j-bk1-container").css("background-color");
            Dom.body_bk.css("background-color",initBackground);
            Util.StorageSetter("background-color",initBackground);

            // 字体
            initFontColor="#555";
            Dom.content_color.css("color","#555");
            Util.StorageSetter("color",initFontColor);

            //标题
            initTitleColor = "#736357";
            Dom.title_color.css("color","#736357");
            Util.StorageSetter("title-color",initTitleColor);

            //选中
            $(".bk-container").html("");
            $(".j-bk1-container").html(`<div class="bk-container-current"></div>`);
            Util.StorageSetter("selectedBk","1");
        });
        $(".j-bk2-container").click(function(){
            // 背景
            initBackground=$(".j-bk2-container").css("background-color");
            Dom.body_bk.css("background-color",initBackground);
            Util.StorageSetter("background-color",initBackground);

            // 字体
            initFontColor=$(".j-bk2-container").css("color");
            Dom.content_color.css("color",initFontColor);
            Util.StorageSetter("color",initFontColor);
            
            //标题
            initTitleColor = "#736357";
            Dom.title_color.css("color","#736357");
            Util.StorageSetter("title-color",initTitleColor);

            //选中
            $(".bk-container").html("");
            $(".j-bk2-container").html(`<div class="bk-container-current"></div>`);
            Util.StorageSetter("selectedBk","2");
        });
        $(".j-bk3-container").click(function(){
            // 背景
            initBackground=$(".j-bk3-container").css("background-color");
            Dom.body_bk.css("background-color",initBackground);
            Util.StorageSetter("background-color",initBackground);

            // 字体
            initFontColor=$(".j-bk3-container").css("color");
            Dom.content_color.css("color",initFontColor);
            Util.StorageSetter("color",initFontColor);

            //标题
            initTitleColor = "#736357";
            Dom.title_color.css("color","#736357");
            Util.StorageSetter("title-color",initTitleColor);
            //选中
            $(".bk-container").html("");
            $(".j-bk3-container").html(`<div class="bk-container-current"></div>`);
            Util.StorageSetter("selectedBk","3");
        });
        $(".j-bk4-container").click(function(){
            // 背景
            initBackground=$(".j-bk4-container").css("background-color");
            Dom.body_bk.css("background-color",initBackground);
            Util.StorageSetter("background-color",initBackground);

            // 字体
            initFontColor=$(".j-bk4-container").css("color");
            Dom.content_color.css("color",initFontColor);
            Util.StorageSetter("color",initFontColor);

            //标题
            initTitleColor = "#736357";
            Dom.title_color.css("color","#736357");
            Util.StorageSetter("title-color",initTitleColor);

            //选中
            $(".bk-container").html("");
            $(".j-bk4-container").html(`<div class="bk-container-current"></div>`);
            Util.StorageSetter("selectedBk","4");
            
        });
        $(".j-bk5-container").click(function(){
            // 背景
            initBackground=$(".j-bk5-container").css("background-color");
            Dom.body_bk.css("background-color",initBackground);
            Util.StorageSetter("background-color",initBackground);

            // 字体
            initFontColor="#fff";
            Dom.content_color.css("color","#fff");
            Util.StorageSetter("color",initFontColor);

            //标题
            initTitleColor = "#fff";
            Dom.title_color.css("color","#fff");
            Util.StorageSetter("title-color",initTitleColor);

            //选中
            $(".bk-container").html("");
            $(".j-bk5-container").html(`<div class="bk-container-current"></div>`);
            Util.StorageSetter("selectedBk","5");
        });
        $("#night_btn").click(function(){
            //触发背景切换事件
            if($("#day_icon").css("display") == "none"){
                //白天=>黑夜
                $("#day_icon").show();
                $("#night_icon").hide();
                // 背景
                initBackground=$(".j-bk5-container").css("background-color");
                Dom.body_bk.css("background-color",initBackground);
                Util.StorageSetter("background-color",initBackground);

                // 字体
                initFontColor="#fff";
                Dom.content_color.css("color","#fff");
                Util.StorageSetter("color",initFontColor);

                //标题
                initTitleColor = "#fff";
                Dom.title_color.css("color","#fff");
                Util.StorageSetter("title-color",initTitleColor);

                //选中
                $(".bk-container").html("");
                $(".j-bk5-container").html(`<div class="bk-container-current"></div>`);
                Util.StorageSetter("selectedBk","5");
            }else{
                //黑夜=>白天
                $("#day_icon").hide();
                $("#night_icon").show();
                // 背景
                initBackground=$(".j-bk1-container").css("background-color");
                Dom.body_bk.css("background-color",initBackground);
                Util.StorageSetter("background-color",initBackground);

                // 字体
                initFontColor="#555";
                Dom.content_color.css("color","#555");
                Util.StorageSetter("color",initFontColor);

                //标题
                initTitleColor = "#736357";
                Dom.title_color.css("color","#736357");
                Util.StorageSetter("title-color",initTitleColor);

                //选中
                $(".bk-container").html("");
                $(".j-bk1-container").html(`<div class="bk-container-current"></div>`);
                Util.StorageSetter("selectedBk","1");
            }
            
        });
        Win.scroll(function(){
            // 滚动时移去顶部导航栏
            Dom.top_nav.hide();
            // 滚动时移去底部工具栏
            Dom.bottom_tools.hide();
            // 滚动时移去设置面板
            Dom.font_container.hide();
            Dom.font_btn.removeClass("current");
        });


        // 翻页操作——上一章/下一章
        $("#prev_btn").click(function(){
            // 获得章节翻页后的数据->UI渲染
            readerModel.prevChapter(function(data){
                readerUI(data);
            });
            $(window).scrollTop(0);
        });
        $("#next_btn").click(function(){
            readerModel.nextChapter(function(data){
                readerUI(data);
            });
            $(window).scrollTop(0);
        });
    }

    main();
}) ();