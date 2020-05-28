var swiperInitialize = function () {
	"use strict";

	this.scene;
	this.camera;
	this.renderer;
	this.controls;

	this.GId = '';
	this.tipconts;
	this.container;
	this.parentCont;
	this.Tweens = [];
	this.Result = false;

	this.init = function (cts, config) {
		var conts = parseCts(cts);
		if (detector() && conts != null) {
			try {
				var config = config || {};
				df_Config = $.extend(true, {}, defaultConfig, config);

				thm.parentCont = conts;
				thm.GId += THREE.Math.generateUUID();
				var TId = conts.attr('id') + '_' + thm.GId;
				thm.container = creatContainer(TId);
				thm.parentCont.html(thm.container);

				try {
					// InitFbx();
				} catch (err) {
					// console.log("缺少加载FBX文件");
				}
				try {
					InitControls();
				} catch (err) {
					console.log("缺少Controls文件");
				}


				if (df_Config.loading)
					loading(thm.container);
				creatTips(thm.container);
				loadTexture()
				initiate();
				init3DMesh();
				is_Init = true;
			} catch (e) {
				thm.Result = 'error! Initialization Error!';
				console.log(e);
				creatError(conts);
				return;
			}
		} else
			thm.Result = 'error! Not Support WebGL!';
	};

	this.render = function (func) {
		if (is_Init) {
			if (!testing())
				return;
			removeLoading(thm.container);
			if (is_Stats)
				df_Stats.begin();
			renderers(func);
			initTween();
		}
	};

	this.rotaScene = function (angle, times) {
		if (is_Init) {
			angle = isNaN(angle * 1) ? 0 : Math.max(0, angle);
			times = isNaN(times * 1) ? 1 : Math.max(100, times);
			rotateScene(angle, times);
		}
	};

	this.disposeRender = function () {
		if (is_Init && testing()) {
			removeEvent();
			thm.controls.dispose();
			thm.container.remove();
			thm.renderer.forceContextLoss();
			thm.renderer.domElement = null;
			thm.renderer.context = null;
			thm.renderer = null;
			is_Init = false;
		}
	};

	var thm = this;
	var df_Stats,
		is_Stats = false; //stats
	var df_Raycaster,
		df_Mouse,
		df_Intersects,
		df_MouseEvent = false; //tips
	var df_Clock,
		df_Width = 0,
		df_Height = 0,
		is_Init = false,
		df_Config = {}; //essential

	var defaultConfig = {
		stats: false,
		loading: false,
		background: {
			color: '#1E1F22',
			opacity: 1
		},
		camera: {
			fov: 45,
			near: 32,
			far: 10000,
			position: [0, 256, 512]
		},
		controls: {
			enablePan: true,
			enableZoom: true,
			enableRotate: true,
			enableDamping: true, //是否阻尼
			dampingFactor: 0.1, //阻尼系数
			keyPanSpeed: 5.0,
			panSpeed: 0.1, //平移系数
			zoomSpeed: 0.1, //缩放系数
			rotateSpeed: 0.013, //旋转系数
			distance: [64, 2048], //缩放距离区间
			polarAngle: [-Infinity, Infinity], //上下旋转区间
			azimuthAngle: [-Infinity, Infinity], //左右旋转区间
		},
		light: {
			Ambient: {
				color: '#FFFFFF',
				strength: 1.0
			},
			isHemisphere: false,
			hemisphere: {
				color: '#EFEFEF',
				groundColor: '#EFEFEF',
				strength: 0.7,
				position: [0, 0, 2000]
			},
		},
		backMap: {
			texture: null,
			opacity: 1,
			lw: [0, 0],
			position: [0, 0, 0],
			side: true
		},
		texture: {}
	};

	function initiate() {

		thm.scene = new THREE.Scene();
		df_Clock = new THREE.Clock();

		var wh = getWH();
		df_Width = wh.w;
		df_Height = wh.h;
		var cm = df_Config.camera,
			bg = df_Config.background;

		thm.camera = new THREE.PerspectiveCamera(cm.fov, wh.w / wh.h, cm.near, cm.far);
		thm.camera.position.set(cm.position[0], cm.position[2], cm.position[1]);
		//
		//thm.camera.lookAt({ x: 0, y: 0, z: 100 });

		thm.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		thm.renderer.setSize(df_Width, df_Height);
		thm.renderer.setClearColor(bg.color, bg.opacity);

		// controls
		thm.controls = new THREE.OrbitControls(thm.camera, thm.container[0]);
		setControls(thm.controls, df_Config.controls);

		setLight(thm.scene, df_Config.light);

		// state
		is_Stats = (df_Config.stats === true) ? true : false;
		if (is_Stats) {
			df_Stats = new Stats();
			thm.container.append($(df_Stats.dom));
		}

		thm.container.append($(thm.renderer.domElement));

		window.addEventListener('resize', onWindowResize, false);

		// mouse event
		df_Raycaster = new THREE.Raycaster();
		df_Mouse = new THREE.Vector2();
		thm.renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
		thm.renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
	}
	// 变量
	const width = 500;
	const zwidth = 500;
	const height = 100;
	let len = 10;
	function init3DMesh(opts) {
		/* var helper = new THREE.GridHelper(400, 20, 0x43908D, 0x3A3B3B);
		thm.scene.add(helper); */
		const floor = createFloor({
			width,
			zwidth,
			height
		});
		thm.scene.add(floor);

		/* const chart = createChart({
			width,
			zwidth,
			height,
			padding: 10
		});
		thm.scene.add(chart) */;
		/*
		do something
		*/
	}
	/* 业务 */
	thm.createChart = (data, opts) => {
		const group = new THREE.Group();
		const { width, zwidth, height, padding } = opts;
		const minHeight = 50;
		const original = new THREE.Vector3(-width/2, 0, -zwidth/2);
		
		let max = data[0][2];
		let min = data[0][2];
		for (let i = 0; i < data.length - 1; i++) {
			max = max < data[i+1][2] ? data[i+1][2] : max;
			min = min > data[i+1][2] ? data[i+1][2] : min;
		}
		  
		const pointGeo = new THREE.BufferGeometry();
		const _data = [];
		const _pointVec = [];
		const _colorVec = [];
		const _surfaces = [];
		const _lines = [];
		data.forEach((elem) => {
			const index = elem[0];
			if (_data[index] === undefined) {
				_data[index] = [];
			}
			_data[index][elem[1]] = elem[2];
		});
		let maxRow = 10; // 最大列 
		_data.forEach((x, _xi) => {
			maxRow = maxRow < x.length ? x.length : maxRow;
		});
		// _data.splice(16, _data.length)
		const maxCol = _data.length; // 最大行
		var vecData = _data.map((x, _xi) => {
			const arr = [];
			x.forEach((y, _yi) => {
				const row = THREE.Math.lerp(0, width, _yi / maxRow);
				const col = THREE.Math.lerp(0, zwidth, _xi / maxCol);
				const _height = THREE.Math.lerp(minHeight, height, (y - min) / max);
				const vec = new THREE.Vector3(row, _height, col);
				const _pvec = original.clone().add(vec);
				_pointVec.push(...Utils.getValues(_pvec));
				_colorVec.push(1,1,1);
				arr.push(_pvec);
			})
			return arr;
		}) 
		for (let i = 0; i < vecData.length; i++) {
			const x = vecData[i];
			for (let _i = 0; _i < x.length; _i++) {
				const y = x[_i];
				if (vecData[i + 1] && x[_i + 1] && vecData[i][_i + 1]) {
					// 面
					const _c = Utils.getValues(y); // 当前
					const _cnext = Utils.getValues(x[_i + 1]); // 当前行 下一个
					const _ccnext = Utils.getValues(vecData[i + 1][_i]); // 下一列的当前索引
					const _crnext = Utils.getValues(vecData[i + 1][_i + 1]); // 下一列的下一个
					_surfaces.push(..._c, ..._cnext, ..._ccnext);
					_surfaces.push(..._cnext, ..._crnext,  ..._ccnext);
					// 线
					_lines.push(..._c, ..._cnext);
					_lines.push(..._c, ..._ccnext);
					_lines.push(..._ccnext, ..._crnext);
				}
			}
		}


		const size = 3;
		pointGeo.addAttribute("position", new THREE.Float32BufferAttribute(_pointVec, 3));
		pointGeo.addAttribute("color", new THREE.Float32BufferAttribute(_colorVec, 3));
		var pMat = new THREE.PointsMaterial({
			color: 0xFFFFFF,
			size: size
		});
		var starField = new THREE.Points(pointGeo, pMat);
		starField.position.y += size / 4;
	 	group.add(starField);

		// 面
		const cStart = Utils.getColorArr('rgba(255,0,0,1)');
		const cEnd = Utils.getColorArr('rgba(255,255,255,1)');
		const faceGeo = new THREE.BufferGeometry();
		
		const faceMat = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Vector4(...Utils.getValues(cStart[0]), cStart[1]) },
				colorEnd: { value: new THREE.Vector4(...Utils.getValues(cEnd[0]), cEnd[1]) },
				height: { value: height },
				u_lightDirection: { value: new THREE.Vector3(1.0, 1.0, 0.5).normalize() }, // 关照角度
				u_lightColor: { value: new THREE.Color('#cfcfcf') }, // 光照颜色
				u_AmbientLight: { value: new THREE.Color('#eeeeee') }, // 全局光颜色
				
			},
			side: THREE.DoubleSide,
			transparent: true,
            // depthWrite: false,
            vertexShader: faceShader.vertexshader,
            fragmentShader: faceShader.fragmentshader
		})
		 
		faceGeo.addAttribute("position", new THREE.Float32BufferAttribute(_surfaces, 3));
		const face = new THREE.Mesh(faceGeo, faceMat);
		thm.faceMesh = face;
		thm.faceMesh._isAnimte = false;
		group.add(face);


		// 线
		const lineGeo = new THREE.BufferGeometry();
		lineGeo.addAttribute("position", new THREE.Float32BufferAttribute(_lines, 3));	
		const lineMat = new THREE.LineBasicMaterial( {
			color: 0xffffff,
			depthWrite: false,
			opacity: 0.2,
			transparent: true
		} );
		const line = new THREE.LineSegments( lineGeo, lineMat );
		thm.lineMesh = line;
		thm.lineMesh.position.y += 0.2
		group.add(line);


		return group;
	}

	thm.initChart = (plane, points, opts) => {
		console.log(plane, points)
		const { min, max } = opts;
		const _planeVec = getData(plane, opts);
		const _pointVec = getData(points, opts);
		// 找到两组数据中最大与最小
		
		 /* data.map((x, i) => { 
			const _data = diffData(x, data.length, i); 
			return _data;
		}); */
		/* console.log(data)*/
		thm.planemesh = createPlane(_planeVec, opts);
		thm.pointMesh = createPoint(_pointVec, opts); 
		thm.planemesh.position.y += 1;
		thm.pointMesh.position.y += 1;

		thm.planemesh.position.z += len / 2;
		thm.pointMesh.position.z += len / 2;
		thm.planemesh.position.x += len / 2;
		thm.pointMesh.position.x += len / 2;
		thm.scene.add(thm.planemesh, thm.pointMesh);
	}
	// 处理数据
	function getData(data, opts) {
		const original = new THREE.Vector3(-width/2, 0, -zwidth/2);
		const { min, max } = opts;
		const xlen = data.length;
		const arr = [];
		const isData = [];
		len = width / data.length;
		 
		for (let x = 0; x < data.length; x++) {
			const _z = THREE.Math.lerp(0, zwidth, x / xlen);
			const elem = data[x];
			const ylen = elem.length;
			const d = [];
			const _isd = [];
			for (let y = 0; y < elem.length; y++) {
				const _x = THREE.Math.lerp(0, width, y / ylen);
				const val = elem[y] || 0;
				
				const _y = THREE.Math.lerp(0, height, val / height) * (height / max);
				const v = new THREE.Vector3(_x, _y, _z);
				d.push(v.clone().add(original));
				_isd.push(elem[y] == null ? 0 : 1);

			 
			}
			arr.push(d);
			isData.push(_isd);
		} 
		return arr;
	}
	function diffData(data, len, index) {
		let max = 0;
		let min = 0;
		for (let i = 0; i < data.length - 1; i++) {
			max = max < data[i+1][1] ? data[i+1][1] : max;
			min = min > data[i+1][1] ? data[i+1][1] : min;
		}
		const z = THREE.Math.lerp(0, zwidth, index / len);
		const xlen = data.length;
		const _data = data.map((elem, i) => {
			// const value = 
			const val = THREE.Math.smoothstep(elem[1], 0, max) * height;
			return {
				val: [elem[0], elem[1]],
				y: val,
				z: z,
				x: THREE.Math.lerp(0, width, i / xlen)
			};
		})
		return _data;
	}
	function gf (v3) {
		return Utils.getValues(v3);
	}
	function createPlane(data, opts) {
		const group = new THREE.Group();
		const { max } = opts;
		
		const _surfaces = [];
		const _lines = [];
		const point = []; 
		const level = 7;
		for (let i = 0; i < data.length; i++) {
			const x = data[i];
			for (let _i = 0; _i < x.length; _i++) {
				const elem = x[_i];
				let y1 = 0;
				let y2 = 0;
				let y3 = 0;
				let y4 = 0;
			 	if (data[i - 1] && data[i - 1][_i-1]) {
					y1 = data[i - 1][_i - 1].y;
				}  
			 	if (data[i + 1] && data[i + 1][_i + 1]) {
					y2 =  elem.y;
				}  
			 	if (data[i + 1] && x[_i - 1]) {
					y3 =  x[_i - 1].y;
				}  
			 	if (data[i - 1] && data[i - 1][_i]) {
					y4 =  data[i - 1][_i].y;
				}   
				const n = len / 2;
				const top1 = new THREE.Vector3(elem.x - n, y1, elem.z - n);
				const top2 = new THREE.Vector3(elem.x + n, y4, elem.z - n);
				const bottom1 = new THREE.Vector3(elem.x - n, y3, elem.z + n);
				const bottom2 = new THREE.Vector3(elem.x + n, y2, elem.z + n);
				// const top = new THREE.Vector3(elem.x, y, elem.z - (len / 2));
				point.push(...gf(top1),...gf(top2))
				point.push(...gf(bottom1),...gf(bottom2))
				const faces = [];
				// 
				for(let _k = 1; _k <= level; _k++){
					const tk = _k / level;
					const t1 = elem.clone().lerp(top1, tk);
					const t2 = elem.clone().lerp(top2, tk);

					const l1 = elem.clone().lerp(top1, tk);
					const l2 = elem.clone().lerp(bottom1, tk);

					const b1 = elem.clone().lerp(bottom1, tk);
					const b2 = elem.clone().lerp(bottom2, tk);

					const r1 = elem.clone().lerp(bottom2, tk);
					const r2 = elem.clone().lerp(top2, tk);

					if (_k == 1) {
						faces.push(t1, t2, elem);
						faces.push(l1, l2, elem);
						faces.push(b1, b2, elem);
						faces.push(r1, r2, elem);
					} else  {
						const ttk = (_k - 1 )/ level
						const _t1 = elem.clone().lerp(top1, ttk);
						const _t2 = elem.clone().lerp(top2, ttk);
						const _l1 = elem.clone().lerp(top1, ttk);
						const _l2 = elem.clone().lerp(bottom1,ttk);
						const _b1 = elem.clone().lerp(bottom1,ttk);
						const _b2 = elem.clone().lerp(bottom2,ttk);
						const _r1 = elem.clone().lerp(bottom2,ttk);
						const _r2 = elem.clone().lerp(top2,ttk);

						 faces.push(t1, t2, _t1);
						 faces.push(t2, _t2, _t1);

						 faces.push(l1, l2, _l1);
						 faces.push(l2, _l2, _l1);

						 faces.push(r1, r2, _r1);
						 faces.push(r2, _r2, _r1);

						 faces.push(b1, b2, _b1);
						 faces.push(b2, _b2, _b1);
						//   faces.push(_t1, _t2, t1);
					}
				}
				faces.forEach((e) => {
					_surfaces.push(...gf(e))
				})
			}
		}
		/* for (let i = 0; i < data.length; i++) {
			const x = data[i];
			for (let _i = 0; _i < x.length; _i++) {
				const y = x[_i];
				if (data[i + 1] && x[_i + 1] && data[i][_i + 1]) {
					const _c = Utils.getValues(y); // 当前
					const _cnext = Utils.getValues(x[_i + 1]); // 当前行 下一个
					const _ccnext = Utils.getValues(data[i + 1][_i]); // 下一列的当前索引
					const _crnext = Utils.getValues(data[i + 1][_i + 1]); // 下一列的下一个
					// _surfaces.push(..._c, ..._cnext, ..._ccnext);
					// _surfaces.push(..._cnext, ..._crnext,  ..._ccnext);
					const center = y.clone().lerp(data[i + 1][_i + 1], 0.5);
					// point.push(...gf(center));
 			
					 _surfaces.push(...gf(center), ...gf(_c),  ...gf(_cnext));
				 	_surfaces.push(...gf(center), ...gf(_cnext),  ...gf(_crnext));
					 _surfaces.push(...gf(center), ...gf(_crnext),  ...gf(_ccnext));
					 _surfaces.push(...gf(center), ...gf(_ccnext),  ...gf(_c));


					 _lines.push(...gf(center), ...gf(_c)); 
					 _lines.push(...gf(_cnext), ...gf(_c)); 
					 _lines.push(...gf(_cnext), ...gf(center)); 
					 
					 _lines.push(...gf(center), ...gf(_cnext)); 
					 _lines.push(...gf(_crnext), ...gf(_cnext)); 
					 _lines.push(...gf(_crnext), ...gf(center)); 

					 _lines.push(...gf(center), ...gf(_crnext)); 
					 _lines.push(...gf(_ccnext), ...gf(_crnext)); 
					 _lines.push(...gf(_ccnext), ...gf(center)); 

					 _lines.push(...gf(center), ...gf(_ccnext)); 
					 _lines.push(...gf(_c), ...gf(_ccnext)); 
					 _lines.push(...gf(_c), ...gf(center));   
				 
				}
			}
		} */
		// 面
		const cStart = Utils.getColorArr('rgba(255,0,0,1)');
		const cEnd = Utils.getColorArr('rgba(255,212,212,1)');
		const faceGeo = new THREE.BufferGeometry();
		console.log(max)
		const faceMat = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Vector4(...Utils.getValues(cStart[0]), cStart[1]) },
				colorEnd: { value: new THREE.Vector4(...Utils.getValues(cEnd[0]), cEnd[1]) },
				height: { value: height },
				// ...THREE.UniformsLib.lights
				u_lightDirection: { value: new THREE.Vector3(1.0, 1.0, 0.5).normalize() }, // 关照角度
				u_lightColor: { value: new THREE.Color('#cfcfcf') }, // 光照颜色
				u_AmbientLight: { value: new THREE.Color('#eeeeee') }, // 全局光颜色
				// ambientLightColor: { value: }
			},
			side: THREE.DoubleSide,
			// transparent: true,
            // depthWrite: false,
			// lights: true,
            vertexShader: faceShader.vertexshader,
            fragmentShader: faceShader.fragmentshader
		})  
		 
		console.log(faceMat)
		faceGeo.addAttribute("position", new THREE.Float32BufferAttribute(_surfaces, 3));
		faceGeo.computeVertexNormals();
		const face = new THREE.Mesh(faceGeo, faceMat);
		group.add(face)

		// line
		const lineGeo = new THREE.BufferGeometry();
		lineGeo.addAttribute("position", new THREE.Float32BufferAttribute(_lines, 3));	
		const lineMat = new THREE.LineBasicMaterial( {
			color: 0xffffff,
			depthWrite: false,
			opacity: 0.9,
			transparent: true
		} );
		const line = new THREE.LineSegments( lineGeo, lineMat );
		group.add(line);


/* 

		const pointGeo = new THREE.BufferGeometry();
		pointGeo.addAttribute("position", new THREE.Float32BufferAttribute(point, 3));
		const size = 4;
		var pMat = new THREE.PointsMaterial({
			color: 0xFf0000,
			size: size
		});
		var starField = new THREE.Points(pointGeo, pMat);
		// starField.position.y += size / 4;
	 	group.add(starField); */

		return group
	};
	function createPlane1(data, opts) {
		const group = new THREE.Group();
		const { max } = opts;
		// const plane 
		/* for (let x = 0; x < data.length; x++) {
			const elem = data[x];
			for (let y = 0; y < elem.length; y++) {
				
			};
		} */
		const _surfaces = [];
		const _lines = [];
		for (let i = 0; i < data.length; i++) {
			const x = data[i];
			for (let _i = 0; _i < x.length; _i++) {
				const y = x[_i];
				if (data[i + 1] && x[_i + 1] && data[i][_i + 1]) {
					// 面
					const _c = Utils.getValues(y); // 当前
					const _cnext =  x[_i + 1]; // 当前行 下一个
					const _ccnext = data[i + 1][_i]; // 下一列的当前索引
					const _crnext = data[i + 1][_i + 1]; // 下一列的下一个
					
					// 点
					const v = y.clone();
					// const t = v.clone().sub(_cnext)
					// v.add(t)
					const rotateNum = 10;

					

					const l = 0.5;
					const d1 = v.clone().lerp(_cnext, l); // 右边
					const d2 = v.clone().lerp(_cnext, -l); // 左
					const d3 = v.clone().lerp(_ccnext, l); // 下
					const d4 = v.clone().lerp(_ccnext, -l);  // 上
					d1.y = 0;
					d2.y = 0;
					d3.y = 0;
					d4.y = 0;

					const _angleOne = Math.PI * 2 / rotateNum;
					const arr = [];
					for (let n = 0; n < rotateNum; n++) {
						const center = new THREE.Vector2(v.x, v.z);
						const around = new THREE.Vector2(d1.x, d1.z);
						 
						const dst = around.clone().rotateAround(center.clone(), _angleOne * n);
						const p1 = new THREE.Vector3(dst.x, 0, dst.y);
						arr.push(p1);
					}
					
					const face = [];
					for (let i=0;i<arr.length;i++){
						_lines.push(...Utils.getValues(arr[i]), ...Utils.getValues(v));
						_surfaces.push(...Utils.getValues(arr[i]), ...Utils.getValues(v))
						if (arr[i+1]) {
							_lines.push(...Utils.getValues(arr[i]), ...Utils.getValues(arr[i + 1]));
							_surfaces.push(...Utils.getValues(arr[i + 1]))
						} else {
							_lines.push(...Utils.getValues(arr[i]), ...Utils.getValues(arr[0]));
							_surfaces.push(...Utils.getValues(arr[0]))
						}
					}

					/* const _v = Utils.getValues(v);
					const _d1 = Utils.getValues(d1);
					const _d2 = Utils.getValues(d2);
					const _d3 = Utils.getValues(d3);
					const _d4 = Utils.getValues(d4); 
					if (v.y != 0) {
						_surfaces.push(..._d2, ..._d4, ..._v);
						_surfaces.push(..._d2, ..._d3, ..._v);
						_surfaces.push(..._d1, ..._d4, ..._v);
						_surfaces.push(..._d1, ..._d3, ..._v); 
					}
 		  			//线
				  	_lines.push(..._v, ..._d1);
				  	_lines.push(..._v, ..._d2);
				  	_lines.push(..._v, ..._d3);
				  	_lines.push(..._v, ..._d4);
				  	_lines.push(..._d1, ..._d3);
				  	_lines.push(..._d3, ..._d2);
				  	_lines.push(..._d2, ..._d4);
				  	_lines.push(..._d4, ..._d1); */
				  	/* _lines.push(..._c, ..._cnext);
					_lines.push(..._c, ..._ccnext);
					_lines.push(..._ccnext, ..._crnext);   */
				}
			}
		}
		// 面
		const cStart = Utils.getColorArr('rgba(255,0,0,1)');
		const cEnd = Utils.getColorArr('rgba(255,212,212,1)');
		const faceGeo = new THREE.BufferGeometry();
		
		const faceMat = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Vector4(...Utils.getValues(cStart[0]), cStart[1]) },
				colorEnd: { value: new THREE.Vector4(...Utils.getValues(cEnd[0]), cEnd[1]) },
				height: { value: max },
				// ...THREE.UniformsLib.lights
				u_lightDirection: { value: new THREE.Vector3(1.0, 1.0, 0.5).normalize() }, // 关照角度
				u_lightColor: { value: new THREE.Color('#cfcfcf') }, // 光照颜色
				u_AmbientLight: { value: new THREE.Color('#eeeeee') }, // 全局光颜色
				// ambientLightColor: { value: }
			},
			side: THREE.DoubleSide,
			transparent: true,
            // depthWrite: false,
			// lights: true,
            vertexShader: faceShader.vertexshader,
            fragmentShader: faceShader.fragmentshader
		})  
		 
		console.log(faceMat)
		faceGeo.addAttribute("position", new THREE.Float32BufferAttribute(_surfaces, 3));
		// faceGeo.computeVertexNormals();
		const face = new THREE.Mesh(faceGeo, faceMat);
		group.add(face)

		// line
		const lineGeo = new THREE.BufferGeometry();
		lineGeo.addAttribute("position", new THREE.Float32BufferAttribute(_lines, 3));	
		const lineMat = new THREE.LineBasicMaterial( {
			color: 0xffffff,
			depthWrite: false,
			opacity: 0.9,
			transparent: true
		} );
		const line = new THREE.LineSegments( lineGeo, lineMat );
		group.add(line);


		return group
	};
	function createPoint(data) {
		const group = new THREE.Group();
		const position = [];
		data.forEach((elem) => {
			elem.forEach((_elem) => {
				position.push(...Utils.getValues(_elem))
			})
		})
		const pointGeo = new THREE.BufferGeometry();
		pointGeo.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
		const size = 2;
		var pMat = new THREE.PointsMaterial({
			color: 0xFFFFFF,
			size: size
		});
		var starField = new THREE.Points(pointGeo, pMat);
		// starField.position.y += size / 4;
	 	group.add(starField);
		return group
	}
	thm.setColor = (name, val) => {
		switch(name) {
			case 'color':
			{
				const colorArr = Utils.getColorArr(val);
				thm.faceMesh.material.uniforms.color.value = new THREE.Vector4(...Utils.getValues(colorArr[0]), colorArr[1])
			}
			break;
			case 'colorEnd':
			{
				const colorArr = Utils.getColorArr(val);
				thm.faceMesh.material.uniforms.colorEnd.value = new THREE.Vector4(...Utils.getValues(colorArr[0]), colorArr[1])
			}
			break;
			case 'lineColor':
			{
				const colorArr = Utils.getColorArr(val);
				thm.lineMesh.material.color = colorArr[0];
				thm.lineMesh.material.opacity = colorArr[1];
			}
			break;
			break;
		}
	}
	function createFloor(opts) {
		// 
		const { width, zwidth, height } = opts;

		const group = new THREE.Group();
		// floor
		const pGeo = new THREE.PlaneBufferGeometry( width, zwidth, 2 );
		const pMat = new THREE.MeshBasicMaterial( {
			color: 0x666666, 
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.1
		} );
		const plane = new THREE.Mesh( pGeo, pMat );
		plane.rotation.x = -Math.PI / 2;
		
		// floor line
		const lineGeo = new THREE.BufferGeometry();
		// x y z
		const original = new THREE.Vector3(-width/2, 0, -zwidth/2);
		const _x = original.clone().add(new THREE.Vector3(width, 0, 0));
		const _y = original.clone().add(new THREE.Vector3(0, height, 0));
		const _z = original.clone().add(new THREE.Vector3(0, 0, 500));
		const position = [];
		position.push(...Utils.getValues(original), ...Utils.getValues(_x));
		position.push(...Utils.getValues(original), ...Utils.getValues(_y));
		position.push(...Utils.getValues(original), ...Utils.getValues(_z));


		lineGeo.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
		const lineMat = new THREE.LineBasicMaterial( {
			color: 0xffffff
		} );
		const line = new THREE.Line( lineGeo, lineMat );

		group.add(plane, line);
		return group;
	}

	/* 结束 */

	function animation(dt) {
		if (thm.faceMesh) {
			if (thm.faceMesh._isAnimte) {
			
			}
		}
	}
	//-
	function loadTexture() {
		var txueLoader = new THREE.TextureLoader();
		var _n = df_Config.texture;
		for (var k in _n) {
			txues['_' + k] = txueLoader.load(_n[k], function (tex) {
				tex.anisotropy = 10;
				tex.minFilter = tex.magFilter = THREE.LinearFilter;
			});
		}
	}

	// mouse event
	function onDocumentMouseMove(event) {
		event.preventDefault();

		if (!df_MouseEvent) {
			df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
			df_Mouse.y = -(event.layerY / df_Height) * 2 + 1;
			df_Raycaster.setFromCamera(df_Mouse, thm.camera);

			//df_Intersects = df_Raycaster.intersectObject( gusMesh );
			/*
			if ( df_Intersects.length > 0 ) {
			thm.container[0].style.cursor = 'pointer';

			} else {
			removeTips();
			thm.container[0].style.cursor = 'auto';
			}
			 */
		}
	}

	function onDocumentMouseDown(event) {
		event.preventDefault();

	}

	function onWindowResize(event) {
		var wh = getWH();
		df_Width = wh.w;
		df_Height = wh.h;
		thm.camera.aspect = wh.w / wh.h;
		thm.renderer.setSize(wh.w, wh.h);
		thm.controls.reset();
	}

	function renderers(func) {
		var fnc = toFunction(func);
		var Animations = function () {
			if (is_Init) {
				fnc.bind(thm)();

				var delta = df_Clock.getDelta();
				if (delta > 0)
					animation(delta);

				thm.controls.update();
				if (is_Stats) df_Stats.update();
				//thm.camera.lookAt({ x: 0, y: 0, z: 100 });

				requestAnimationFrame(Animations);
				thm.renderer.render(thm.scene, thm.camera);
			}
		};
		Animations();
	}

	function testing() {
		return thm.renderer instanceof THREE.WebGLRenderer;
	}

	function rotateScene(angle, times) {
		var ay = thm.scene.rotation.y + angle;
		new TWEEN.Tween(thm.scene.rotation).to({
			y: ay
		}, times).start();
	}

	function initTween() {
		for (var k = thm.Tweens.length - 1; k >= 0; k--) {
			thm.Tweens[k].start(TWEEN.now());
		}
	}

	function getWH() {
		return {
			w: thm.container.width(),
			h: thm.container.height()
		};
	}

	function setControls(controls, opts) {
		controls.enablePan = opts.enablePan;
		controls.enableKeys = opts.enablePan;
		controls.enableZoom = opts.enableZoom;
		controls.enableRotate = opts.enableRotate;

		controls.enableDamping = opts.enableDamping;
		controls.dampingFactor = opts.dampingFactor;
		controls.keyPanSpeed = opts.keyPanSpeed;

		controls.panSpeed = opts.panSpeed;
		controls.zoomSpeed = opts.zoomSpeed;
		controls.rotateSpeed = opts.rotateSpeed;

		controls.minDistance = opts.distance[0];
		controls.maxDistance = opts.distance[1];
		controls.minPolarAngle = opts.polarAngle[0];
		controls.maxPolarAngle = opts.polarAngle[1];
		controls.minAzimuthAngle = opts.azimuthAngle[0];
		controls.maxAzimuthAngle = opts.azimuthAngle[1];
		// controls.mouseDownPrevent = opts.mouseDownPrevent;
	}

	function setLight(scene, opts) {
		scene.add(new THREE.AmbientLight(opts.Ambient.color, opts.Ambient.strength));
		if (opts.isHemisphere) {
			var lh = opts.hemisphere,
				hLight = new THREE.HemisphereLight(lh.color, lh.groundColor, lh.strength);
			hLight.position.set(lh.position[0], lh.position[2], lh.position[1]);
			scene.add(hLight);
		}
	}

	function detector() {
		try {
			return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
		} catch (e) {
			return false;
		}
	}

	function isFunction(a) {
		return Object.prototype.toString.call(a) === '[object Function]';
	}

	function toFunction(a) {
		var b = Object.prototype.toString.call(a) === '[object Function]';
		return b ? a : function (o) {};
	}

	function parseCts(cts) {
		var $dom = (typeof cts == 'object') ? $(cts) : $('#' + cts);
		if ($dom.length <= 0)
			return null;
		return $dom;
	}

	function removeEvent() {
		window.removeEventListener('resize', onWindowResize, false);
		thm.renderer.domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
		thm.renderer.domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
	}

	//tips
	function creatTips(container) {
		var tmp = {
			tipCont: '<div id="GM_tips"></div>',
			icon: '<i></i>',
			txt: '<span id="DM_txt"></span>',
			bage: '<div></div>'
		};
		var tipcont = $(tmp.tipCont).css({
			'position': 'absolute',
			'left': '0',
			'top': '0',
			'display': 'none',
			'z-index': '30000'
		});
		tipcont.append($(tmp.bage).css({
			'position': 'absolute',
			'background': '#000',
			'opacity': '0.3',
			'border-radius': '5px',
			'height': '100%',
			'width': '100%'
		}));
		tipcont.append($(tmp.bage).css({
				'position': 'relative',
				'padding': '4px 6px',
				'color': '#fff',
				'font-size': '12px',
				'margin-left': '10px'
			})
			.append($(tmp.icon).css({
				'border': '3px solid #fff',
				'position': 'absolute',
				'left': '-2px',
				'margin-top': '6px',
				'border-radius': '3px'
			}))
			.append($(tmp.txt).css({
				'position': 'relative',
				'padding': '4px 6px',
				'color': '#fff;',
				'font-size': '12px'
			}).html('')));
		thm.tipconts = tipcont;
		$(container).append(tipcont);
	}

	function removeTips() {
		thm.tipconts.css('display', 'none');
		thm.tipconts.find('span#DM_txt').html('');
	}

	function setTips(conts, position) {
		var vec2 = transCoord(position),
			tmx = Math.max(10, Math.min(df_Width - 40, vec2.x + 6)),
			tmy = Math.max(10, Math.min(df_Height - 34, vec2.y - 12));
		thm.tipconts.css({
			'left': tmx,
			'top': tmy,
			'display': 'block'
		});
		thm.tipconts.find('span#DM_txt').html(conts);
	}

	function transCoord(position) {
		var halfW = df_Width / 2,
			halfH = df_Height / 2,
			vec3 = position.clone().applyMatrix4(thm.scene.matrix).project(thm.camera),
			mx = Math.round(vec3.x * halfW + halfW),
			my = Math.round(-vec3.y * halfH + halfH);
		return new THREE.Vector2(mx, my);
	}

	// loading
	function loading(container) {
		var loading = $('<div id="t_loading"></div>');
		loading.css({
			'position': 'absolute',
			'top': 0,
			'left': 0,
			'right': 0,
			'bottom': 0,
			'z-index': 20000
		});
		var loadImg = 'data:image/gif;base64,R0lGODlhIAAgAPMAAAAAAP///zg4OHp6ekhISGRkZMjIyKioqCYmJhoaGkJCQuDg4Pr6+gAAAAAAAAAAACH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAIAAgAAAE5xDISWlhperN52JLhSSdRgwVo1ICQZRUsiwHpTJT4iowNS8vyW2icCF6k8HMMBkCEDskxTBDAZwuAkkqIfxIQyhBQBFvAQSDITM5VDW6XNE4KagNh6Bgwe60smQUB3d4Rz1ZBApnFASDd0hihh12BkE9kjAJVlycXIg7CQIFA6SlnJ87paqbSKiKoqusnbMdmDC2tXQlkUhziYtyWTxIfy6BE8WJt5YJvpJivxNaGmLHT0VnOgSYf0dZXS7APdpB309RnHOG5gDqXGLDaC457D1zZ/V/nmOM82XiHRLYKhKP1oZmADdEAAAh+QQACgABACwAAAAAIAAgAAAE6hDISWlZpOrNp1lGNRSdRpDUolIGw5RUYhhHukqFu8DsrEyqnWThGvAmhVlteBvojpTDDBUEIFwMFBRAmBkSgOrBFZogCASwBDEY/CZSg7GSE0gSCjQBMVG023xWBhklAnoEdhQEfyNqMIcKjhRsjEdnezB+A4k8gTwJhFuiW4dokXiloUepBAp5qaKpp6+Ho7aWW54wl7obvEe0kRuoplCGepwSx2jJvqHEmGt6whJpGpfJCHmOoNHKaHx61WiSR92E4lbFoq+B6QDtuetcaBPnW6+O7wDHpIiK9SaVK5GgV543tzjgGcghAgAh+QQACgACACwAAAAAIAAgAAAE7hDISSkxpOrN5zFHNWRdhSiVoVLHspRUMoyUakyEe8PTPCATW9A14E0UvuAKMNAZKYUZCiBMuBakSQKG8G2FzUWox2AUtAQFcBKlVQoLgQReZhQlCIJesQXI5B0CBnUMOxMCenoCfTCEWBsJColTMANldx15BGs8B5wlCZ9Po6OJkwmRpnqkqnuSrayqfKmqpLajoiW5HJq7FL1Gr2mMMcKUMIiJgIemy7xZtJsTmsM4xHiKv5KMCXqfyUCJEonXPN2rAOIAmsfB3uPoAK++G+w48edZPK+M6hLJpQg484enXIdQFSS1u6UhksENEQAAIfkEAAoAAwAsAAAAACAAIAAABOcQyEmpGKLqzWcZRVUQnZYg1aBSh2GUVEIQ2aQOE+G+cD4ntpWkZQj1JIiZIogDFFyHI0UxQwFugMSOFIPJftfVAEoZLBbcLEFhlQiqGp1Vd140AUklUN3eCA51C1EWMzMCezCBBmkxVIVHBWd3HHl9JQOIJSdSnJ0TDKChCwUJjoWMPaGqDKannasMo6WnM562R5YluZRwur0wpgqZE7NKUm+FNRPIhjBJxKZteWuIBMN4zRMIVIhffcgojwCF117i4nlLnY5ztRLsnOk+aV+oJY7V7m76PdkS4trKcdg0Zc0tTcKkRAAAIfkEAAoABAAsAAAAACAAIAAABO4QyEkpKqjqzScpRaVkXZWQEximw1BSCUEIlDohrft6cpKCk5xid5MNJTaAIkekKGQkWyKHkvhKsR7ARmitkAYDYRIbUQRQjWBwJRzChi9CRlBcY1UN4g0/VNB0AlcvcAYHRyZPdEQFYV8ccwR5HWxEJ02YmRMLnJ1xCYp0Y5idpQuhopmmC2KgojKasUQDk5BNAwwMOh2RtRq5uQuPZKGIJQIGwAwGf6I0JXMpC8C7kXWDBINFMxS4DKMAWVWAGYsAdNqW5uaRxkSKJOZKaU3tPOBZ4DuK2LATgJhkPJMgTwKCdFjyPHEnKxFCDhEAACH5BAAKAAUALAAAAAAgACAAAATzEMhJaVKp6s2nIkolIJ2WkBShpkVRWqqQrhLSEu9MZJKK9y1ZrqYK9WiClmvoUaF8gIQSNeF1Er4MNFn4SRSDARWroAIETg1iVwuHjYB1kYc1mwruwXKC9gmsJXliGxc+XiUCby9ydh1sOSdMkpMTBpaXBzsfhoc5l58Gm5yToAaZhaOUqjkDgCWNHAULCwOLaTmzswadEqggQwgHuQsHIoZCHQMMQgQGubVEcxOPFAcMDAYUA85eWARmfSRQCdcMe0zeP1AAygwLlJtPNAAL19DARdPzBOWSm1brJBi45soRAWQAAkrQIykShQ9wVhHCwCQCACH5BAAKAAYALAAAAAAgACAAAATrEMhJaVKp6s2nIkqFZF2VIBWhUsJaTokqUCoBq+E71SRQeyqUToLA7VxF0JDyIQh/MVVPMt1ECZlfcjZJ9mIKoaTl1MRIl5o4CUKXOwmyrCInCKqcWtvadL2SYhyASyNDJ0uIiRMDjI0Fd30/iI2UA5GSS5UDj2l6NoqgOgN4gksEBgYFf0FDqKgHnyZ9OX8HrgYHdHpcHQULXAS2qKpENRg7eAMLC7kTBaixUYFkKAzWAAnLC7FLVxLWDBLKCwaKTULgEwbLA4hJtOkSBNqITT3xEgfLpBtzE/jiuL04RGEBgwWhShRgQExHBAAh+QQACgAHACwAAAAAIAAgAAAE7xDISWlSqerNpyJKhWRdlSAVoVLCWk6JKlAqAavhO9UkUHsqlE6CwO1cRdCQ8iEIfzFVTzLdRAmZX3I2SfZiCqGk5dTESJeaOAlClzsJsqwiJwiqnFrb2nS9kmIcgEsjQydLiIlHehhpejaIjzh9eomSjZR+ipslWIRLAgMDOR2DOqKogTB9pCUJBagDBXR6XB0EBkIIsaRsGGMMAxoDBgYHTKJiUYEGDAzHC9EACcUGkIgFzgwZ0QsSBcXHiQvOwgDdEwfFs0sDzt4S6BK4xYjkDOzn0unFeBzOBijIm1Dgmg5YFQwsCMjp1oJ8LyIAACH5BAAKAAgALAAAAAAgACAAAATwEMhJaVKp6s2nIkqFZF2VIBWhUsJaTokqUCoBq+E71SRQeyqUToLA7VxF0JDyIQh/MVVPMt1ECZlfcjZJ9mIKoaTl1MRIl5o4CUKXOwmyrCInCKqcWtvadL2SYhyASyNDJ0uIiUd6GGl6NoiPOH16iZKNlH6KmyWFOggHhEEvAwwMA0N9GBsEC6amhnVcEwavDAazGwIDaH1ipaYLBUTCGgQDA8NdHz0FpqgTBwsLqAbWAAnIA4FWKdMLGdYGEgraigbT0OITBcg5QwPT4xLrROZL6AuQAPUS7bxLpoWidY0JtxLHKhwwMJBTHgPKdEQAACH5BAAKAAkALAAAAAAgACAAAATrEMhJaVKp6s2nIkqFZF2VIBWhUsJaTokqUCoBq+E71SRQeyqUToLA7VxF0JDyIQh/MVVPMt1ECZlfcjZJ9mIKoaTl1MRIl5o4CUKXOwmyrCInCKqcWtvadL2SYhyASyNDJ0uIiUd6GAULDJCRiXo1CpGXDJOUjY+Yip9DhToJA4RBLwMLCwVDfRgbBAaqqoZ1XBMHswsHtxtFaH1iqaoGNgAIxRpbFAgfPQSqpbgGBqUD1wBXeCYp1AYZ19JJOYgH1KwA4UBvQwXUBxPqVD9L3sbp2BNk2xvvFPJd+MFCN6HAAIKgNggY0KtEBAAh+QQACgAKACwAAAAAIAAgAAAE6BDISWlSqerNpyJKhWRdlSAVoVLCWk6JKlAqAavhO9UkUHsqlE6CwO1cRdCQ8iEIfzFVTzLdRAmZX3I2SfYIDMaAFdTESJeaEDAIMxYFqrOUaNW4E4ObYcCXaiBVEgULe0NJaxxtYksjh2NLkZISgDgJhHthkpU4mW6blRiYmZOlh4JWkDqILwUGBnE6TYEbCgevr0N1gH4At7gHiRpFaLNrrq8HNgAJA70AWxQIH1+vsYMDAzZQPC9VCNkDWUhGkuE5PxJNwiUK4UfLzOlD4WvzAHaoG9nxPi5d+jYUqfAhhykOFwJWiAAAIfkEAAoACwAsAAAAACAAIAAABPAQyElpUqnqzaciSoVkXVUMFaFSwlpOCcMYlErAavhOMnNLNo8KsZsMZItJEIDIFSkLGQoQTNhIsFehRww2CQLKF0tYGKYSg+ygsZIuNqJksKgbfgIGepNo2cIUB3V1B3IvNiBYNQaDSTtfhhx0CwVPI0UJe0+bm4g5VgcGoqOcnjmjqDSdnhgEoamcsZuXO1aWQy8KAwOAuTYYGwi7w5h+Kr0SJ8MFihpNbx+4Erq7BYBuzsdiH1jCAzoSfl0rVirNbRXlBBlLX+BP0XJLAPGzTkAuAOqb0WT5AH7OcdCm5B8TgRwSRKIHQtaLCwg1RAAAOwAAAAAAAAAAAA==';
		loading.css('background', '#000000 url(' + loadImg + ') center center no-repeat');
		$(container).append(loading);
	}

	function removeLoading(container) {
		$(container).children('div#t_loading').css({
			'background': 'none',
			'display': 'none'
		});
	}

	function creatContainer(id) {
		var containers = $('<div></div>');
		containers.css("cssText", "height:100%;width:100%;position:relative !important");
		containers.attr('id', id);
		return containers;
	}

	function creatError(conts, errorText) {
		var error = $('<div class="data-error"></div>'),
			error_text = errorText || '数据错误。。。';
		if (undefined != conts) {
			var ctxt = "color:#fff;position:absolute;top:49%;width:100%;text-align:center;";
			error.css("cssText", ctxt);
			conts.html(error.html(error_text));
		}
	}

};