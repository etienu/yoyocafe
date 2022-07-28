window.onload = function() {
    //    変数
    var path    = "./";        //    ページパス
    var imgpath = "./img/";    //    画像パス
    //    mev = matter event
    var mev_items = new Array();   //    matter物理オブジェクトの保存
    var mev_hover_id       = -1;   //    マウスカーソルがホバーしているアイテムの管理
    var mev_hover_collision=  0;   //    マウスカーソルがホバーしているアイテムのcollision
    var mev_info_count     = -1;   //    セリフのカウンター
    var mev_info_hidden_yoyo  = 0; //    キャラクタの管理
    var mev_link_scroll_wait  = 0; //    スムーススクロール時の待ち時間
    var mev_canvas_in     = false; //    canvas内にカーソルがあるか
    var collisions = [];
    var startPoint = { x: 0, y: 0 };


    //Matter.js モジュール 初期設定
    var Engine = Matter.Engine,    //    物理シュミレーションおよびレンダリングを管理するコントローラーとなるメソッド
        Render = Matter.Render,    //    描画処理
        Runner = Matter.Runner,    //    継続的な処理を更新するユーティリティ
        Events = Matter.Events,         //    イベントの起動
        World  = Matter.World,          //    物理演算領域の作成・操作するメソッドを含む
        Mouse  = Matter.Mouse,          //    マウス操作
        Body   = Matter.Body,           //    剛体のモデルを作成・操作するメソッドを含む
        Bodies = Matter.Bodies,         //    一般的な剛体モデルを作成するメソッドを含む
        Constraint = Matter.Constraint, //    制約を作成・操作するメソッドを含む
        Composite  = Matter.Composite,  //    Body、Constraintその他の集合の追加等
        Composites = Matter.Composites, //    Composite(複合ボディ)を作る為の関数群
        Common   = Matter.Common,       //    汎用関数
        Query    = Matter.Query,        //    衝突クエリを実行
        Vertices = Matter.Vertices,     //    頂点のセットを作成・操作するメソッドを含む
        MouseConstraint = Matter.MouseConstraint; //    マウスの制約を作成するためのメソッドを含む

    //  ページ内のセットしたい要素を指定
    var container    = document.getElementById('js__canvas-container');
    //    キャンバスの指定
    var canvas       = document.getElementById('js__canvas');

    //  起動時にウインドウのサイズを確認する
    var render_width = 640;
    var render_height= 480;
    //  スマホ版
    if (document.body.clientWidth < 768) {
        render_width = 320;
        render_height= 240;
    }

    // Matter.js エンジン作成
    var engine = Engine.create();
    // create a renderer
    var render = Render.create({
        element: container,
        canvas : canvas,
        engine : engine,
        options: {
            width : render_width,
            height: render_height,
            wireframes: false,          //    true : 画像は消える。当たり判定の描画
            pixelRatio: 1,
            background: 'rgba(0,0,0,0)' //    背景を透明に
        }
    });
    //    matterのカメラ領域を設定
    Render.lookAt(render, { min: { x: 0, y: 0 }, max: { x: 640, y: 480 } });

    //----------------------------------------
    // マウス作成
    var canvasMouse = Mouse.create(container);
    var mouseConstraint = MouseConstraint.create(engine, {
        mouse: canvasMouse,
        constraint: {
            stiffness: 0.2,        //  剛性
            render: {
                visible: false     //  マウスのドラッグ表示を隠す
            }
        },
        //    選択可能カテゴリを制限したい場合のフィルタ
        //    collisionFilter: { category: 0x0001, mask: 0xFFFFCC, group: 1 }
    });
    //    マウスの追加
    Composite.add(engine.world, mouseConstraint);
    render.mouse = canvasMouse;

    //  category
    //  0x0001 : 地面・壁・キャラクタ
    //  0x0002 : キャラクタ画像
    //  0x0010 : ドーナツ
    //  0x0020 : クッキー
    //  0x0030 : コーヒー
    //  0x0200 : ロゴ

    //----------------------------------------
    //  マップ
    //----------------------------------------
    //    床
    // Matter.Bodies.rectangle(x, y, width, height, [options]) 
    var ground = Bodies.rectangle(320, 480, 640, 20, {
        isStatic: true,
        collisionFilter: { category: 0x0001 },
        render: {
            fillStyle  : 'rgba(180, 120, 0, 0.5)', // 塗りつぶす色: CSSの記述法で指定
            strokeStyle: 'rgba(  0,   0, 0, 0.5)', // 線の色      : CSSの記述法で指定
            lineWidth: 10    //    線の太さ
        }
    });
    //    左右壁
    var groundL = Bodies.rectangle( 30     , 200, 60, 400, { isStatic: true, render: { fillStyle: 'rgba(0, 0, 0, 0)' } });
    var groundR = Bodies.rectangle(640 - 30, 200, 60, 400, { isStatic: true, render: { fillStyle: 'rgba(0, 0, 0, 0)' } });
    // 配列で追加する事によって一つの固まりになる
    Composite.add(engine.world, [ground, groundL, groundR]);


    //----------------------------------------
    // キャラクタ
    //----------------------------------------
    // vp = vertex path
    //  [当たり判定用]複雑な形は三つに分割
    var vp_yoyo1 = Vertices.fromPath('21 240 15 90 20 43 42 13 92 6 129 29 154 98 158 134 148 240');
    var vp_yoyo2 = Vertices.fromPath('148 240 195 144 246 164 339 153 339 240');
    var vp_yoyo3 = Vertices.fromPath('269 240 299 105 303 62 323 49 354 68 351 103 316 175 310 202 288 240');
    // 配列で追加する事によって一つの固まりになる
    var fvx = 180;        // X位置
    var fvy = 420 - 15;   // Y位置
    var fv_y1 = Bodies.fromVertices(fvx       , fvy   , vp_yoyo1, { isStatic: true, collisionFilter: { category: 0x0001 }, render: { visible: false } });
    var fv_y2 = Bodies.fromVertices(fvx+97    , fvy+67, vp_yoyo2, { isStatic: true, collisionFilter: { category: 0x0001 }, render: { visible: false } });
    var fv_y3 = Bodies.fromVertices(fvx+97+125, fvy+ 6, vp_yoyo3, { isStatic: true, collisionFilter: { category: 0x0001 }, render: { visible: false } });
    Composite.add( engine.world, [fv_y1, fv_y2, fv_y3] );


    //  [画像用物体] 画像用の極小点
    var vp_yoyoi = Vertices.fromPath('21 240 21 239 22 239');    //    キャラクタ

    //  [キャラクタ画像]
    //    Matter.Composites.stack(xx, yy, columns, rows, columnGap, rowGap, callback)
    var c_yoyoimg1 = Composites.stack(220, 352, 1, 1, 1, 1, function(x, y) {
        return Bodies.fromVertices(x, y, [vp_yoyoi], {
            isStatic: true,    //    動かなくする
            collisionFilter: { category: 0x0002 },
            //スプライトの設定
            render: { sprite: { texture: imgpath + 'yoyo.png' } }
        }, true);
    });
    //  [キャラクタ画像:口パク] 非表示
    var c_yoyoimg2 = Composites.stack(220, 352, 1, 1, 1, 1, function(x, y) {
        return Bodies.fromVertices(x, y, [vp_yoyoi], {
            isStatic: true,
            collisionFilter: { category: 0x0002 },
            render: { sprite: { texture: imgpath + 'yoyo2.png' }, opacity:0 }
        }, true );
    });

    var cmp_yoyoimg1 = Composite.add( engine.world, c_yoyoimg1 );
    var cmp_yoyoimg2 = Composite.add( engine.world, c_yoyoimg2 );


    //----------------------------------------
    //  ロゴ [yoyocafe 画像]
    //----------------------------------------
    var vp_logo  = Vertices.fromPath('0 100 0 0 150 0 150 100'); //    ロゴ
    //  カテゴリを設定
    var c_logo_cat = 0x0200;
    var c_logo = Composites.stack(450, 30, 1, 1, 1, 1, function(x, y) {
        return Bodies.fromVertices(x, y, [vp_logo], {
            isStatic: true,
            collisionFilter: { category: c_logo_cat },
            render: { sprite: { texture: imgpath + '/logo.png' } }
        }, true);
    });
    Composite.add(engine.world, c_logo);


    //----------------------------------------
    //初期物体を追加
    //----------------------------------------
    for (var i = 0; i < 10; i++) { matter_addItem();  }


    //----------------------------------------
    //イベント
    //----------------------------------------
    //フレーム毎に実行
    var ev_count = 0;
    //    初期化処理
    Events.on(engine, 'beforeUpdate', function(event) {
        ev_count += 1;
        var mouse = mouseConstraint.mouse,
            bodies = Composite.allBodies( engine.world ),
            endPoint = mouse.position;
        // 点が知りたいが判定する為に最小限の線にする必用がある
        startPoint.x = endPoint.x;
        startPoint.y = endPoint.y - 1;

        //  線ではなく単にカーソル位置が知りたい
        collisions = Query.ray( bodies, startPoint, endPoint );
    });

    //    各機能処理
    Events.on(engine, 'afterUpdate', function(event) {
        //  一定時間ごとにアイテム追加
        if ( 20 < ev_count ) {
            ev_count = 0;
            matter_addItem();
        }
        //  アイテム数が40超えたら減らす
        if ( 40 < mev_items.length ) {
            Composite.remove( engine.world, mev_items[0] );
            mev_items.shift();
        }
        //  info表示の処理
        task_info();
        //  スムーススクロールのカーソル変化待機
        if ( 0 < mev_link_scroll_wait ) {
            mev_link_scroll_wait -= 1;
        }
    });
    //    描画・判定処理
    Events.on(render, 'afterRender', function() {
        //  初期化
        if( mev_hover_id != -1 ){
            //  スプライトのサイズ戻す
            mev_hover_collision.bodyA.render.sprite.xScale = 1.0;
            mev_hover_collision.bodyA.render.sprite.yScale = 1.0;
            mev_hover_id = -1; //  ホバーしてるカテゴリID
        }
        var mouse = mouseConstraint.mouse,
        context = render.context,
        endPoint = mouse.position || { x: 100, y: 100 };
        //    描画処理の開始
        Render.startViewTransform( render );//    なくても動くが一応
        context.beginPath();                //    パス描画の初期化
        //  カーソル初期化
        document.body.style.cursor = 'auto';
        //    点判定なので基本1回
        for ( var i = 0; i < collisions.length; i++ ) {
            var collision = collisions[i];
            var px = collision.bodyA.position.x;
            var py = collision.bodyA.position.y;
            //    カーソルが載った際に点を表示
            //    context.rect(collision.bodyA.position.x - 4.5, collision.bodyA.position.y - 4.5, 8, 8);
            var cat = collision.bodyA.collisionFilter.category;
            //  スプライトを拡大
            collision.bodyA.render.sprite.xScale = 1.1;
            collision.bodyA.render.sprite.yScale = 1.1;
            //    ホバー中のcollision保存
            mev_hover_collision = collision;
            //  アイテム
            if ((cat & 0x00f0) == 0x0010) {
                change_cursor('pointer');
                mev_hover_id = 0x0010;
            }
            if ((cat & 0x00f0) == 0x0020) {
                change_cursor('pointer');
                mev_hover_id = 0x0020;
            }
            if ((cat & 0x00f0) == 0x0030) {
                change_cursor('pointer');
                mev_hover_id = 0x0030;
            }
            //  ホバー処理 : ロゴ
            if ((cat & 0x0f00) == c_logo_cat) {
                //Composite.scale(c_logo, 1.001, 1.001, { x: px, y: py }); // 実体のサイズ変更( 拡大し続ける )
                change_cursor('pointer');
                mev_hover_id = c_logo_cat;
            }
        }
        //    セットしたrectの描画
        context.fillStyle = 'rgba(255,165,0,0.7)';
        context.fill();

        Render.endViewTransform(render);
    });


    //----------------------------------------
    //    開始処理
    //----------------------------------------
    // renderer実行
    Render.run(render);
    // runner実行
    var runner = Runner.create();
    Runner.run(runner, engine);
//    Engine.run(engine);    //    Engineでも動く



    //========================================
    //    Functions
    //----------------------------------------
    canvas.addEventListener('click', btnClick);      // マウス処理
    canvas.addEventListener('touchend', btnClick);   // タッチ処理
    canvas.addEventListener('mouseover', mouseOver); // カーソルが範囲内に入った
    canvas.addEventListener('mouseout' , mouseOut);  // カーソルが範囲外に出た
    window.addEventListener('resize', resizeWindow); // キャンバスサイズが変わった

    //----------------------------------------
    //    画面サイズ変更
    //----------------------------------------
    function resizeWindow(){
        //    キャンバスコンテナのサイズを取得
        var cx = container.clientWidth;
        var cy = container.clientHeight;
        render.options.width = cx;
        render.options.height= cy;
        // マウスの倍率を修正
        var    mxp = 640 / cx;    //    640基準
        var    myp = 480 / cy;    //    480基準
        Mouse.setScale( canvasMouse, {x: mxp, y: myp});
    }

    //----------------------------------------
    //    マウス関係
    //----------------------------------------
    //    クリック処理
    function btnClick() {
        //    カーソル下に何もない
        if (mev_hover_id == -1) return;
        //    ホバー中のカテゴリIDによって分岐
        switch (mev_hover_id) {
            case 0x0010: open_info("コーヒー"); break;
            case 0x0020: open_info("クッキー"); break;
            case 0x0030: open_info("ドーナツ"); break;
            case c_logo_cat:
                open_info("yoyocafe");
                goto_link("id_cafe");    //    IDへジャンプ
                //    window.location.href ="https://www.google.co.jp/search?q=cafe";    //    別のページへ移動
                break;
        }
    }

    //  カーソルがキャンバス内にいる
    function mouseOver() {  mev_canvas_in = true;  }
    //  カーソルがキャンバス外に出ている
    function mouseOut()  {  mev_canvas_in = false; }
    //  カーソル変更
    function change_cursor(i_name) {
        if (!mev_canvas_in) return;            //    キャンバス外の場合処理無効
        if (0 < mev_link_scroll_wait) return;  //    スクロール中は無効
        document.body.style.cursor = i_name;
    }


    //----------------------------------------
    //    アイテムの追加
    //----------------------------------------
    function matter_addItem() {
        var rnd = parseInt(Math.random() * 20);
        var x = 100 + rnd *  20;
        var y =   0 - rnd * 120;

        //item01 : コーヒー
        var itm01 = Bodies.circle(x, y, 24, {
            density    : 0.0005,// 密度: 単位面積あたりの質量
            frictionAir: 0.06,  // 空気抵抗(空気摩擦)
            restitution: 0,     // 弾力性(1だとぶれすぎる)
            friction   : 0.01,  // 本体の摩擦
            collisionFilter: {
                category: 0x0010 | 0x0001,
                mask: 0x0001 //  カテゴリ1としか判定しない
            },
            render: { sprite: { texture: imgpath + '/item01.png' } },
            timeScale: 1 //時間の倍率を設定(1で1倍速)
        });
        //item02 : クッキー
        var itm02 = Bodies.circle(x, y, 24, {
            density: 0.0005,
            frictionAir: 0.06,
            restitution: 0,
            friction: 0.01,
            collisionFilter: { category: 0x0020 | 0x0001, mask: 0x0001 },
            render: { sprite: { texture: imgpath + 'item02.png' } },
            timeScale: 1
        });
        //item02 : ドーナツ
        var itm03 = Bodies.circle(x, y, 24, {
            density: 0.0005,
            frictionAir: 0.06,
            restitution: 0,
            friction: 0.01,
            collisionFilter: { category: 0x0030 | 0x0001, mask: 0x0001 },
            render: { sprite: { texture: imgpath + 'item03.png' } },
            timeScale: 1.5
        });
        //    ランダムで選択
        var itm = Common.choose([itm01, itm02, itm03]);

        //  配列にアイテムを追加
        mev_items.push(itm);

        //  空間に追加
        Composite.add(engine.world, [itm]);
    }


    //----------------------------------------
    //  スムーススクロール
    //----------------------------------------
    function goto_link(i_id) {
        let target = document.getElementById(i_id);       //    指定IDの要素を取得
        const rect = target.getBoundingClientRect().top;  //    要素の相対距離を取得
        const offset = window.pageYOffset;                //    ページのスクロールY位置を取得
        const position = rect + offset;        // 現在位置+距離 = 移動先のY位置
        //  カーソルを直す
        document.body.style.cursor = 'auto';
        //  カーソル変化処理待機
        mev_link_scroll_wait = 100;
        // スクロール処理
        window.scrollTo({ top: position, behavior: 'smooth' });
    }

    //----------------------------------------
    //  infoの表示
    //----------------------------------------
    function open_info(i_text) {
        mev_info_count = 100;    //    表示時間
        var infof = document.getElementsByClassName('canvas-infoframe')[0];  //    info枠の要素
        var info = document.getElementsByClassName('canvas-info')[0];        //    infoテキストの要素
        infof.style.display = "block";    //    表示
        info.textContent = i_text;        //    テキスト変える
        //  画像を入れ替え
        if (mev_info_hidden_yoyo == 0) {
            mev_info_hidden_yoyo = 1;    //    画像変更中
            c_yoyoimg1.bodies[0].render.opacity =0;
            c_yoyoimg2.bodies[0].render.opacity =1;
            Body.setPosition(c_yoyoimg2.bodies[0], c_yoyoimg1.bodies[0].position );	//差分画像の座標をキャラの位置に合わせる
        }
    }


    //----------------------------------------
    //  infoの処理( ループ中で実行 )
    //----------------------------------------
    function task_info() {
        //  0未満は通常時
        if (mev_info_count < 0) return;
        mev_info_count -= 1;    //    カウント減らす
        //  0以下で終了処理
        if (mev_info_count <= 0) {
            mev_info_count = -1;    //    -1で停止
            var infof = document.getElementsByClassName('canvas-infoframe')[0];
            infof.style.display = "none";    //    非表示
            //  画像を戻す
            if (mev_info_hidden_yoyo == 1) {
                mev_info_hidden_yoyo = 0;
                c_yoyoimg1.bodies[0].render.opacity =1;
                c_yoyoimg2.bodies[0].render.opacity =0;
            }
        }
    }
}
