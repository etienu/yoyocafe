//wppath : ワードプレスのパス、php内で出力している変数
//console.log("[wppath]" + wppath);
var path = "./";		//	ページパス
var imgpath = "./img/";	//	画像パス
var mev_items = new Array(); //matterイベントアイテム
var mev_hover_id = -1;
var mev_info_count = -1;
var mev_info_hidden_yoyo = 0;
var mev_info_hidden_yoyox = 0;
var mev_link_scroll_wait = 0;
var mev_canvas_in = false;
window.onload = function() {
    //Matter.js モジュール 初期設定
    var Engine = Matter.Engine, //物理シュミレーションおよびレンダリングを管理するコントローラーとなるメソッド
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies, //一般的な剛体モデルを作成するメソッドを含む
        Composite = Matter.Composite,
        Events = Matter.Events,
        World = Matter.World, //物理演算領域の作成・操作するメソッドを含む
        Mouse = Matter.Mouse,
        Body = Matter.Body, //剛体のモデルを作成・操作するメソッドを含む
        Constraint = Matter.Constraint, //制約を作成・操作するメソッドを含む
        Composites = Matter.Composites,
        Common = Matter.Common,
        Query = Matter.Query,
        Vertices = Matter.Vertices, //頂点のセットを作成・操作するメソッドを含む
        MouseConstraint = Matter.MouseConstraint; //マウスの制約を作成するためのメソッドが含む
    // Matter.jsのEngineを作成
    //  ページ内のセットしたいclassを指定
    var container = document.getElementById('js__canvas-container');
    //    console.log("[psmatter]", container);

    //  起動時にウインドウのサイズを確認する
    var render_width = 640;
    var render_height = 480;
    //  SP版
    if (document.body.clientWidth < 768) {
        render_width = 320;
        render_height = 240;
    }

    // Matter.js エンジン作成
    var engine = Engine.create();
    var canvas = document.getElementById('js__canvas');
    // create a renderer
    var render = Render.create({
        element: container,
        canvas: canvas,
        engine: engine,
        options: {
            width: render_width, // 320
            height: render_height, //240,
            wireframes: false,
            pixelRatio: 1,
            background: 'rgba(0,0,0,0)', //, //'#fafafa',
            //            wireframeBackground: '#222'
        }
    });
    //  SP版
    if (document.body.clientWidth < 768) {
        //    render_width = 320;
        //render_height = 240;
        Render.lookAt(render, { min: { x: 0, y: 0 }, max: { x: 640, y: 480 } });
        //console.log("[SP版です]");
    }

    var collisions = [],
        startPoint = { x: 400, y: 100 };

    // マウス操作を追加
    var canvasMouse = Mouse.create(container);
    //    var mouseConstraint = MouseConstraint.create(engine, { mouse: canvasMouse });
    // mouseConstraintの設定
    var mouseConstraint = MouseConstraint.create(engine, {
        //element: canvas.childNodes[0], //マウス操作を感知する要素を指定
        mouse: canvasMouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
            //render: {
            //    strokeStyle: "rgba(0, 0, 0, 0)" //マウス操作の表示を隠す
            //},
        },
        // 選択可能を制限したい場合のフィルタ
        //collisionFilter: { category: 0x0001, mask: 0xFFFFCC, group: 1 }
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = canvasMouse;

    //----------------------------------------
    // 情報
    //----------------------------------------
    //  22年現在、Worldは過去の物でCompositeに置き換えられている
    //----------------------------------------
    // [キャラクタ] よよ
    //----------------------------------------
    // vertex path
    //  [画像用物体] 画像用の極小点
    var vp_yoyoi = Vertices.fromPath('21 240 21 239 22 239');
    var vp_logo = Vertices.fromPath('0 100 0 0 150 0 150 100');
    //  [当たり判定用]複雑な形は三つに分割
    var vp_yoyo = Vertices.fromPath('21 240 15 90 20 43 42 13 92 6 129 29 154 98 158 134 148 240');
    var vp_yoyo2 = Vertices.fromPath('148 240 195 144 246 164 339 153 339 240');
    var vp_yoyo3 = Vertices.fromPath('269 240 299 105 303 62 323 49 354 68 351 103 316 175 310 202 288 240');

    //  [yoyo画像]
    var c_yoyoimg = Composites.stack(220, 352, 1, 1, 1, 1, function(x, y) {
        var color = '#f19648';
        return Bodies.fromVertices(x, y, [vp_yoyoi], {
            isStatic: true,
            // 画像を判定カテゴリ2とする
            collisionFilter: { category: 0x0002 },
            render: {
                fillStyle: color,
                strokeStyle: color,
                lineWidth: 1,
                //スプライトの設定
                sprite: { texture: imgpath + 'yoyo2.png' }
            }
        }, true);
    });
    //  [yoyo画像:口変化ver]
    var c_yoyoimg2 = Composites.stack(1220, 352, 1, 1, 1, 1, function(x, y) {
        return Bodies.fromVertices(x, y, [vp_yoyoi], {
            isStatic: true,
            collisionFilter: { category: 0x0002 },
            render: { sprite: { texture: imgpath + 'yoyo.png' } }
        }, true);
    });

    //Composite.add(engine.world, v_yoyo);

    var cmp_yoyoimg2 = Composite.add(engine.world, c_yoyoimg2);
    var cmp_yoyoimg = Composite.add(engine.world, c_yoyoimg);
    //console.log("[imgID]" + cmp_yoyoimg.id);
    //    Composite.add(engine.world, syoyo_w);
    // コンポジットで追加する事によって一つの固まりとみなす
    var fvx = 180;
    var fvy = 420 - 15;
    var fv_y = Bodies.fromVertices(fvx, fvy, vp_yoyo, {
        isStatic: true,
        collisionFilter: { category: 0x0001 },
        render: { fillStyle: 'rgba(0, 0, 0, 0)' }
    });
    var fv_y2 = Bodies.fromVertices(fvx + 97, fvy + 67, vp_yoyo2, {
        isStatic: true,
        collisionFilter: { category: 0x0001 },
        render: { fillStyle: 'rgba(0, 0, 0, 0)' }
    });
    var fv_y3 = Bodies.fromVertices(fvx + 97 + 125, fvy + 6, vp_yoyo3, {
        isStatic: true,
        collisionFilter: { category: 0x0001 },
        render: { fillStyle: 'rgba(0, 0, 0, 0)' }
    });
    Composite.add(engine.world, [fv_y, fv_y2, fv_y3]);

    //----------------------------------------
    //  ロゴ
    //  [yoyo_cafe 画像]
    //  idを設定
    var c_logo_cat = 0x0200;
    var c_logo = Composites.stack(450, 30, 1, 1, 1, 1, function(x, y) {
        var color = '#f19648';
        return Bodies.fromVertices(x, y, [vp_logo], {
            isStatic: true,
            collisionFilter: { category: c_logo_cat },
            render: {
                fillStyle: color,
                strokeStyle: color,
                lineWidth: 1,
                sprite: { texture: imgpath + '/logo.png' }
            }
        }, true);
    });
    Composite.add(engine.world, c_logo);

    //----------------------------------------
    //  マップ
    //床
    var ground = Bodies.rectangle(320, 490, 640, 20, {
        isStatic: true,
        collisionFilter: {
            category: 0x0001
        },
        render: {
            //            fillStyle: '#977559', // 塗りつぶす色: CSSの記述法で指定
            fillStyle: 'rgba(180, 120, 0, 0)', // 塗りつぶす色: CSSの記述法で指定
            strokeStyle: 'rgba(0, 0, 0, 0)', // 線の色: CSSの記述法で指定
            lineWidth: 0
        }
    });
    var groundL = Bodies.rectangle(30, 200, 60, 400, { isStatic: true, render: { fillStyle: 'rgba(0, 0, 0, 0)' } });
    var groundR = Bodies.rectangle(640 - 30, 200, 60, 400, { isStatic: true, render: { fillStyle: 'rgba(0, 0, 0, 0)' } });
    // add bodies
    // コンポジットで追加する事によって一つの固まりとみなす
    Composite.add(engine.world, [ground, groundL, groundR]);
    //World.add(engine.world, [ground, groundL, groundR]);
    //  画像のワイヤーフレーム確認用
    //var tyoyo = Bodies.rectangle(100, 200, 60, 60, { isStatic: true });
    //World.add(engine.world, [tyoyo]);


    //----------------------------------------
    //初期物体を追加する
    for (var i = 0; i < 10; i++) {
        matter_addItem();
    }
    //----------------------------------------
    //イベント
    //フレーム毎に実行
    var ev_time = 0;
    var ev_count = 0;
    var ev_countB = 0;
    Events.on(engine, 'beforeUpdate', function(event) {

        ev_time += 1;
        ev_count += 1;
        ev_countB += 1;
        //console.log("[ev_loop]" + event_time);
        var mouse = mouseConstraint.mouse,
            bodies = Composite.allBodies(engine.world),
            endPoint = mouse.position || { x: 100, y: 600 };
        // 点が知りたいが判定する為に最小限の線にする必用がある
        startPoint.x = endPoint.x;
        startPoint.y = endPoint.y - 1;

        //  collisions = Query.ray(bodies, startPoint, endPoint);
        //  線ではなく単にカーソル位置が知りたい
        collisions = Query.ray(bodies, startPoint, endPoint);
    });
    Events.on(engine, 'afterUpdate', function(event) {
        //  一定時間ごとにアイテム追加
        if (20 < ev_count) {
            ev_count = 0;
            matter_addItem();
            //            console.time("[ev_addItem]" + event_time);

        }
        //  アイテム数が40超えたら減らす
        if (40 < mev_items.length) {
            Composite.remove(engine.world, mev_items[0]);
            mev_items.shift();
        }
        //  info表示の処理
        task_info();
        //  カーソル変化待機
        if (0 < mev_link_scroll_wait) {
            mev_link_scroll_wait -= 1;
        }
    });
    Events.on(render, 'afterRender', function() {
        //  初期化
        mev_hover_id = -1; //  ホバーしてるID
        var mouse = mouseConstraint.mouse,
            context = render.context,
            endPoint = mouse.position || { x: 100, y: 600 };

        Render.startViewTransform(render);
        context.beginPath();
        /*
                //        context.moveTo(startPoint.x, startPoint.y);
                //        context.lineTo(endPoint.x, endPoint.y);
                if (collisions.length > 0) {
                    context.strokeStyle = '#fff';
                } else {
                    context.strokeStyle = '#555';
                }
                context.lineWidth = 0.5;
                context.stroke();
        */
        //  カーソル初期化
        document.body.style.cursor = 'auto';

        for (var i = 0; i < collisions.length; i++) {
            var collision = collisions[i];
            var px = collision.bodyA.position.x;
            var py = collision.bodyA.position.y;
            //context.rect(collision.bodyA.position.x - 4.5, collision.bodyA.position.y - 4.5, 8, 8);
            var cat = collision.bodyA.collisionFilter.category;
            //  スプライトのサイズ変更
            //collision.bodyA.render.sprite.xScale = 1.1;
            //collision.bodyA.render.sprite.yScale = 1.1;
            //console.log(cmp_yoyoimg);

            //Composite.translate(c_yoyoimg, { x: 100, y: 0 });
            //cmp_yoyoimg.bodies[0].render.visible = false;
            //cmp_yoyoimg.bodies[0].render.opacity = 0.5;
            //cmp_yoyoimg.bodies[0].position.x = 300;
            //cmp_yoyoimg.bodies[0].positionPrev.x = 300;
            //  アイテム
            if ((cat & 0x00f0) == 0x0010) {
                change_cursor('pointer');
                mev_hover_id = 0x0010;
            }
            if ((cat & 0x00f0) == 0x0020) {
                change_cursor('pointer');
                //    document.body.style.cursor = 'help';
                mev_hover_id = 0x0020;
            }
            if ((cat & 0x00f0) == 0x0030) {
                change_cursor('pointer');
                //document.body.style.cursor = 'progress';
                mev_hover_id = 0x0030;
            }
            //  ホバー処理 : ロゴ
            //console.log("[cat]" + cat + "[logo]" + 0x0f00 + "/" + c_logo_cat);
            if ((cat & 0x0f00) == c_logo_cat) {
                //Composite.scale(c_logo, 1.001, 1.001, { x: px, y: py }); // 本体のサイズ変更
                //console.log("ロゴですな!");
                //context.rect(collision.bodyA.position.x - 4.5, collision.bodyA.position.y - 4.5, 80, 80);
                change_cursor('pointer');
                mev_hover_id = c_logo_cat;
            }
        }

        context.fillStyle = 'rgba(255,165,0,0.7)';
        context.fill();

        Render.endViewTransform(render);
    });
    //----------------------------------------
    // エンジン起動
    // run the renderer
    Render.run(render);
    // create runner
    var runner = Runner.create();
    // run the engine
    Runner.run(runner, engine);

    function matter_addItem() {
        var rnd = parseInt(Math.random() * 20);
        var x = 100 + rnd * 20;
        var y = 0 - rnd * 120;

        //item01 : コーヒー
        var itm01 = Bodies.circle(x, y, 24, { //ボールを追加
            density: 0.0005, // 密度: 単位面積あたりの質量
            frictionAir: 0.06, // 空気抵抗(空気摩擦)
            restitution: 0, // 弾力性(1だとぶれすぎる)
            friction: 0.01, // 本体の摩擦
            collisionFilter: {
                category: 0x0010 | 0x0001,
                mask: 0x0001 //  カテゴリ1としか判定しない
            },
            render: { //ボールのレンダリングの設定
                sprite: { texture: imgpath + '/item01.png' }
            },
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

        var itm = Common.choose([itm01, itm02, itm03]);

        //  配列にアイテムを追加
        mev_items.push(itm);

        //  ワールドに追加
        Composite.add(engine.world, [itm]);

    } // function matter_addItem() END

    //  マウス処理
    canvas.addEventListener('click', btnClick);
    //  タッチ処理
    canvas.addEventListener('touchend', btnClick);
    //  カーソルが範囲内か
    canvas.addEventListener('mouseover', mouseOver);
    canvas.addEventListener('mouseout', mouseOut);

    function btnClick() {
        //console.log("[クリック自体は・・]");
        if (mev_hover_id == -1) return;
        //var info = document.getElementsByClassName('pfe__canvas-info')[0];
        switch (mev_hover_id) {
            case 0x0010:
                open_info("コーヒー");
                break;
            case 0x0020:
                open_info("クッキー");
                break;
            case 0x0030:
                open_info("ドーナツ");
                break;
            case c_logo_cat:
                open_info("yoyocafe");
                //goto_link("id_cafe");
				window.location.href ="https://www.google.co.jp/search?q=cafe";
                break;
        }

    }
    //  キャンバス内にいるのか
    function mouseOver() {
        mev_canvas_in = true;
    }

    function mouseOut() {
        mev_canvas_in = false;
    }

    //  カーソル変更
    function change_cursor(i_name) {
        if (!mev_canvas_in) return;
        if (0 < mev_link_scroll_wait) return;
        document.body.style.cursor = i_name;
    }

    //  簡易スムーススクロール
    function goto_link(i_id) {
        let target = document.getElementById(i_id);
        const rect = target.getBoundingClientRect().top;
        const offset = window.pageYOffset;
        const position = rect + offset; // 移動先のポジション取得
        //  カーソルを直す
        document.body.style.cursor = 'auto';
        //  カーソル変化処理待機
        mev_link_scroll_wait = 100;
        // window.scrollToでスクロール
        window.scrollTo({ top: position, behavior: 'smooth' });
    }

    //  infoの表示
    function open_info(i_text) {
        mev_info_count = 100;
        var infof = document.getElementsByClassName('canvas-infoframe')[0];
        var info = document.getElementsByClassName('canvas-info')[0];
        infof.style.display = "block";
        info.textContent = i_text;
        //console.log("[open_info]" + i_text);
        //  画像をどかす
        if (mev_info_hidden_yoyo == 0) {
            mev_info_hidden_yoyo = 1;
            Composite.translate(c_yoyoimg, { x: 1000, y: 0 }); //  消す
            Composite.translate(c_yoyoimg2, { x: -1000, y: 0 }); // 表示
            mev_info_hidden_yoyox = 1000;
        }

    }

    //  infoの処理
    function task_info() {
        //  マイナスなら何もしない
        if (mev_info_count < 0) return;
        mev_info_count -= 1;
        //  終了処理
        if (mev_info_count <= 0) {
            mev_info_count = -1;
            var infof = document.getElementsByClassName('canvas-infoframe')[0];
            infof.style.display = "none";
            //  画像を戻す
            if (mev_info_hidden_yoyo == 1) {
                mev_info_hidden_yoyo = 0;
                Composite.translate(c_yoyoimg, { x: mev_info_hidden_yoyox * -1, y: 0 });
                Composite.translate(c_yoyoimg2, { x: mev_info_hidden_yoyox * 1, y: 0 });
                mev_info_hidden_yoyox = 0;
            }
        }
    }
}
