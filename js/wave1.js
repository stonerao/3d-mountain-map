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
		thm.camera.position.set(cm.position[0], cm.position[1], cm.position[2]);
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
	const rayMeshs = [];
	let faceindex = [];
	let threshold = { hight: 200, low: 100 };
	let len = 10;
	function init3DMesh(opts) {
		/* var helper = new THREE.GridHelper(400, 20, 0x43908D, 0x3A3B3B);
		thm.scene.add(helper); */
		const floor = createFloor({
			width,
			zwidth,
			height:  height * 3
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
				animat: { value: 1 },
				color: { value: new THREE.Vector4(...Utils.getValues(cStart[0]), cStart[1]) },
				colorEnd: { value: new THREE.Vector4(...Utils.getValues(cEnd[0]), cEnd[1]) },
				height: { value: height },
				u_lightDirection: { value: new THREE.Vector3(1.0, 1.0, 1.0).normalize() }, // 关照角度
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
		// thm.lineMesh.position.y += 0.2
		group.add(line);


		return group;
	}

	thm.initChart = (plane, points, opts, axios) => {
		const { max, min } = opts;
		const _planeVec = getData(plane, opts);
		const _pointVec = getData(points, opts);
		const _textVecsL = getTextData(axios, 'left');
		const _textVecsT = getTextData(axios, 'top');
	 	
		// 找到两组数据中最大与最小
		
		 /* data.map((x, i) => { 
			const _data = diffData(x, data.length, i); 
			return _data;
		}); */
		/* console.log(data)*/
		// 计算阈值高低
		const _height = height / max * min;
		const _threshold = opts.threshold;
		threshold.low = _threshold[0] / max * height - _height;
		threshold.hight = _threshold[1] / max * height - _height;
		
		thm.planemesh = createPlane(_planeVec, opts, plane);
		thm.pointMesh = createPoint(_pointVec, opts, points);
		thm.textureMeshL = createTexts(axios, _textVecsL, 'left'); 
		thm.textureMeshT = createTexts(axios, _textVecsT, 'top'); 
		thm.CordonMesh = createThreshold(threshold, opts);


		thm.planemesh.position.set(len / 2, 1, len / 2);
		thm.pointMesh.position.set(len / 2, 1, len / 2);

		thm.scene.add(thm.planemesh, /* thm.pointMesh, */ thm.textureMeshL, thm.textureMeshT);
		thm.scene.add(thm.CordonMesh);
	}
	// 处理数据
	function getData(data, opts) {
		const original = new THREE.Vector3(-width/2, 0, -zwidth/2);
		const { min, max } = opts;
		const _height = height / max * min;
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
				
				const _y = THREE.Math.lerp(0, height, val / height) * (height / max) - _height;
				const v = new THREE.Vector3(_x, _y, _z);
				d.push(v.clone().add(original));
				_isd.push(elem[y] == null ? 0 : 1); 
			}
			arr.push(d);
			isData.push(_isd);
		} 
		return arr;
	}
	// 获取文字标签的位置
	function getTextData(axios, pvs) {
		const size = zwidth / axios.length;
		const zsize = width / axios.length;
		const position = [];
		axios.forEach((elem, i) => {
			if (pvs === 'top') {
				position.push(new THREE.Vector3(size * (i + 0.5) - width / 2, 0, zwidth / -2));
			} else {
				position.push(new THREE.Vector3(width / -2, 0, zsize * (i + 0.5) - zwidth / 2));
			}
		});
		return position;
	}
 
	function gf (v3) {
		return Utils.getValues(v3);
	}
	function getFaceParms(planeData, opts) {
		const data = getData(planeData, opts);
		const { max, min } = opts; 
		const _surfaces = [];
		const _lines = [];
		const point = []; 
		const level = 1;
		faceindex = [];
		let _tindex = 0;
		const allPoints = [];
		const y = height / max * min * 0.9;
		for (let i = 0; i < data.length; i++) {
			const x = data[i];
			const arr = [];
			allPoints.push(arr);
			for (let _i = 0; _i < x.length; _i++) {
				const _vecs = [];
				arr.push(_vecs);
				const elem = x[_i];
				  
				const n = len / 2;
				const top1 = new THREE.Vector3(elem.x - n, y, elem.z - n);
				const top2 = new THREE.Vector3(elem.x + n, y, elem.z - n);
				const bottom1 = new THREE.Vector3(elem.x - n, y, elem.z + n);
				const bottom2 = new THREE.Vector3(elem.x + n, y, elem.z + n);
				_vecs.push(elem, top1, top2, bottom1, bottom2);
			}
		}
		for (let i = 0; i < allPoints.length; i++) {
			const elem = allPoints[i]; 
			const bottom = allPoints[i  + 1] ; // 下
			
			for (let x = 0; x < elem.length; x++) {
				const curr = elem[x];
				const faces = [];
				const cnext = elem[x + 1]; // 右侧 
				if (i == 0 && cnext ) {
					const _bt1 = curr[1].clone();
					const _bt2 = curr[2].clone();
					_bt1.y = 0;
					_bt2.y = 0;
				 	faces.push([cnext[0], curr[0], _bt1]);
				 	faces.push([cnext[0], _bt1, _bt2]); 
				}
				if (i == allPoints.length - 1 && cnext ) {
					const _bt1 = curr[3].clone();
					const _bt2 = curr[4].clone();
					_bt1.y = 0;
					_bt2.y = 0;
				 	faces.push([cnext[0], curr[0], _bt1]);
				 	faces.push([cnext[0], _bt1, _bt2]); 
				}
				if (x == 0 && cnext ) {
					const _bt1 = curr[1].clone();
					const _bt2 = curr[3].clone();
					_bt1.y = 0;
					_bt2.y = 0;
				  
				}
				/* faces.push([curr[1], curr[2], curr[0]]);
				faces.push([curr[1], curr[3], curr[0]]);
				faces.push([curr[3], curr[4], curr[0]]);
				faces.push([curr[2], curr[4], curr[0]]);   */

				if (bottom && curr[0].y !=0 && bottom[x][0].y != 0) {
				 	/*  if (bottom[x][0].y !==0 ) {
						faces.push([curr[0], bottom[x][0], curr[3]]);
						faces.push([curr[0], bottom[x][0], curr[4]]); 
					}  */
					_lines.push(...gf(curr[0]),...gf(bottom[x][0])); 
					if (bottom[x + 1] && bottom[x + 1][0].y !==0 ) {
						faces.push([curr[0], bottom[x][0], bottom[x + 1][0]]);
						// faces.push([curr[0],  bottom[x + 1][0], curr[4]]); 
						
					}

				}  
				
			 	if (cnext && curr[0].y !=0 && cnext[0].y != 0) {
					if (cnext[0].y !==0 ) {
					  	//  faces.push([curr[0], cnext[0], curr[2]]); 
				  		//  faces.push([curr[0], cnext[0], curr[4]]); 
					  	_lines.push(...gf(curr[0]),...gf(cnext[0]));  
						if (bottom&&bottom[x + 1] && bottom[x + 1][0].y !==0 ) {
							faces.push([ bottom[x + 1][0], cnext[0],curr[0]]); 
						}
					}
				} 
			 	  
				faces.forEach((elem) => {
					elem.forEach(e=>{
						_surfaces.push(...gf(e));
						faceindex.push(_tindex);
					})
					_tindex+=elem.length;
				}); 
			}
		}
		 
		return {
			position: _surfaces,
			line: _lines,
			faceindex: faceindex
		}
	}
	function createPlane(data, opts) {
		const group = new THREE.Group();
		const { max, min } = opts;
		const _surfaces = [];
		const _lines = [];
		const _point = [];
		faceindex = [];
		let _tindex = 0;
		const allPoints = [];
		const y = height / max * min * 0;
		console.log(data)
		for (let i = 0; i < data.length; i++) {
			const x = data[i];
			const arr = [];
			allPoints.push(arr);
			for (let _i = 0; _i < x.length; _i++) {
				const _vecs = [];
				arr.push(_vecs);
				const elem = x[_i];
				let y1 = 0;
				let y2 = 0;
				let y3 = 0;
				let y4 = 0;
				if (data[i - 1] && data[i - 1][_i - 1]) {
					y1 = data[i - 1][_i - 1].y;
				}
				if (data[i + 1] && data[i + 1][_i + 1]) {
					y2 = elem.y;
				}
				if (data[i + 1] && x[_i - 1]) {
					y3 = x[_i - 1].y;
				}
				if (data[i - 1] && data[i - 1][_i]) {
					y4 = data[i - 1][_i].y;
				}
				const n = len / 2;
				const top1 = new THREE.Vector3(elem.x - n, y, elem.z - n);
				const top2 = new THREE.Vector3(elem.x + n, y, elem.z - n);
				const bottom1 = new THREE.Vector3(elem.x - n, y, elem.z + n);
				const bottom2 = new THREE.Vector3(elem.x + n, y, elem.z + n);
				_vecs.push(elem, top1, top2, bottom1, bottom2);
  
			}
		}
		const level = 5;
		const lowNum = 1.5;
		for (let i = 0; i < allPoints.length; i++) {
			const elem = allPoints[i];
			const top = allPoints[i - 1]; // 上
			const bottom = allPoints[i + 1]; // 下
			const pointVec = [];
			const lineVec = [];
			for (let x = 0; x < elem.length; x++) {
				const curr = elem[x];
				const faces = [];
				const cnext = elem[x + 1]; // 右侧
				const cprv = elem[x - 1]; // 左侧

				 
				lineVec.push(curr[3], curr[4])
				lineVec.push(curr[2], curr[4])

				// 圆锥
				pointVec.push(curr[0]);
				let nextCenter = false; // 当前右侧
				let bnextCenter = false; // 下一个
				let matCenter = false; // 与右侧 下 右下 的中心
				let bnextVec = false;
				let rightNext = false;
				
				if (cnext) {
					nextCenter = curr[0].clone().lerp(cnext[0], 0.5);
					nextCenter.y = curr[0].y < cnext[0].y ? curr[0].y / lowNum : cnext[0].y / lowNum;

					lineVec.push(curr[0],nextCenter)
					lineVec.push(nextCenter, cnext[0])
				}

				if (bottom && bottom[x]) {
					const bcur = bottom[x]; 
					bnextCenter = curr[0].clone().lerp(bcur[0], 0.5);
					bnextCenter.y = curr[0].y < bcur[0].y ? curr[0].y / lowNum : bcur[0].y / lowNum;

					lineVec.push(curr[0],bnextCenter)
					lineVec.push(bnextCenter, bcur[0])
					if (cnext) {
						const bnext = bottom[x + 1];
						bnextVec = bnext[0].clone().lerp(bottom[x][0], 0.5);
						bnextVec.y = bnext[0].y < bcur[0].y ? bnext[0].y / lowNum : bcur[0].y / lowNum;

						rightNext = bnext[0].clone().lerp(cnext[0], 0.5);
						rightNext.y = bnext[0].y < cnext[0].y ? bnext[0].y / lowNum : cnext[0].y / lowNum;

						const { min } = Utils.getMinMax([curr[0].y, cnext[0].y, bcur[0].y, bnext[0].y]);
						matCenter = curr[4].clone();
						matCenter.y = min / lowNum;

						pointVec.push(matCenter);

					}
				}
				if (nextCenter && bnextCenter && matCenter && bnextVec && rightNext) {
					const tsuc = [];
					tsuc.push([nextCenter, matCenter, curr[0]]);
					tsuc.push([bnextCenter, matCenter, curr[0]]);
				 	tsuc.push([nextCenter, matCenter, cnext[0]]);
					tsuc.push([rightNext, matCenter, cnext[0]]);
					tsuc.push([rightNext, matCenter, bottom[x + 1][0]]);
					tsuc.push([bnextVec, matCenter, bottom[x + 1][0]]);

					tsuc.push([bnextCenter, matCenter, bottom[x][0]]);
					tsuc.push([bnextVec, matCenter, bottom[x][0]]);


					let t = 4;
					const segment = 8;
					tsuc.forEach((__elem, _i) => {
						const arr = [];
						for (let _i = 0; _i <= t; _i++) {
							const bv = __elem[0].clone().lerp(__elem[1], _i / t);
							// lineVec.push(__elem[2], bv); 
							arr.push([__elem[2], bv]);


						}
						for (let _i = 0; _i < arr.length - 1; _i++) {
							const _next = arr[_i + 1];
							const _cur = arr[_i];
							// faces.push([_cur[0], _cur[1], _next[1]])	
							for (let _x = 1; _x <= segment; _x++) {
								const v1 = _cur[0].clone().lerp(_cur[1], _x / segment);
								const v2 = _next[0].clone().lerp(_next[1], _x / segment);
								if (_x == 1) {
									faces.push([_cur[0], v1, v2]);
								} else {
									const s1 = _cur[0].clone().lerp(_cur[1], (_x - 1) / segment);
									const s2 = _next[0].clone().lerp(_next[1], (_x - 1) / segment);

									faces.push([s1, v1, v2]);
									faces.push([s1, s2, v2]);


									lineVec.push(s1, v1);
									lineVec.push(v1, v2);
									lineVec.push(s1, s2);
									lineVec.push(s2, v2);
								}

							}
						}
					})
				
					
				}

				 lineVec.forEach((elem) => {
					_lines.push(...gf(elem));
				});   
			 	faces.forEach((elem) => {
					elem.forEach(e => {
						_surfaces.push(...gf(e));
					})
				});  
			 
			}
			pointVec.forEach(elem => {
				_point.push(...gf(elem));
			})
		}
		// 面
		const cStart = Utils.getColorArr('rgba(255,0,0,1)');
		const cEnd = Utils.getColorArr('rgba(225, 225, 225,1)');
		const selectStart = Utils.getColorArr('rgba(44,123,21,1)');
		const selectEnd = Utils.getColorArr('rgba(123,144,25,1)');
		const faceGeo = new THREE.BufferGeometry();

		const faceMat = new THREE.ShaderMaterial({
			uniforms: {
				time: {
					value: 0
				},
				animat: {
					value: 0.1
				},
				color: {
					value: new THREE.Vector4(...Utils.getValues(cStart[0]), cStart[1])
				},
				colorEnd: {
					value: new THREE.Vector4(...Utils.getValues(cEnd[0]), cEnd[1])
				},
				selectStart: {
					value: new THREE.Vector4(...Utils.getValues(selectStart[0]), selectStart[1])
				},
				selectEnd: {
					value: new THREE.Vector4(...Utils.getValues(selectEnd[0]), selectEnd[1])
				},
				height: {
					value: height - height / max * min
				},
				select: {
					value: 1.0
				},
				u_lightDirection: {
					value: new THREE.Vector3(1.0, 0.0, 0.0).normalize()
				}, // 关照角度
				u_lightColor: {
					value: new THREE.Color('#cfcfcf')
				}, // 光照颜色
				u_AmbientLight: {
					value: new THREE.Color('#dddddd')
				}, // 全局光颜色
				// ambientLightColor: { value: }
			},
			side: THREE.DoubleSide,
			// transparent: true,
			//  depthWrite: false,
			// lights: true,
			vertexShader: faceShader.vertexshader,
			fragmentShader: faceShader.fragmentshader
		})
	

		faceGeo.addAttribute("position", new THREE.Float32BufferAttribute(_surfaces, 3));
		faceGeo.addAttribute("u_index", new THREE.Float32BufferAttribute(faceindex, 1));
		const face = new THREE.Mesh(faceGeo, faceMat);
		// faceGeo.computeVertexNormals();
		face._isAnimate = false;
		thm.faceMesh1 = face;
		rayMeshs.push(face);
		face.name = 'face';
		face.renderOrder = 99;
		group.add(face)
		// line
		const lineGeo = new THREE.BufferGeometry();
		lineGeo.addAttribute("position", new THREE.Float32BufferAttribute(_lines, 3));	
		const lineMat = new THREE.LineBasicMaterial( {
			color: new THREE.Color('rgb(93,255,43)'),
		 	// depthWrite: false,
			// depthTest: false,
			opacity: 0.6,
			transparent: true
		} );
		const line = new THREE.LineSegments( lineGeo, lineMat );
		line.scale.y = 1;
		thm.linesMesh = line;
		group.add(line);
		console.log(lineGeo)

		// point 
		const pointMesh = getPointMesh(_point, {
			size: 3
		});
		group.add(pointMesh);

		thm.updateFaceAnimate(true)
		return group
	};
	thm.updateFaceData = (data, opts) => {
		// 更新数据 进行shader动画 
		const _data = getFaceParms(data, opts); 
		 
		thm.faceMesh1.geometry.addAttribute("position", new THREE.Float32BufferAttribute(_data.position, 3));
		thm.faceMesh1.geometry.addAttribute("u_index", new THREE.Float32BufferAttribute(_data.faceindex, 1));
		thm.linesMesh.geometry.addAttribute("position", new THREE.Float32BufferAttribute(_data.line, 3));
		thm.faceMesh1.geometry.computeVertexNormals(); 
		
	}
	thm.updateFaceAnimate= (state)=> {
		if(state == true) {
			thm.faceMesh1.material.uniforms.animat.value = 0;
			thm.faceMesh1._isAnimate = 1;
		} else {
			thm.faceMesh1.material.uniforms.animat.value = 1;
			thm.faceMesh1._isAnimate = 2;
		}
	}
	function getPointMesh(position, opts = {}) {
		const {
			color = '#fff',
			size = 5
		} = opts;
		const pointGeo = new THREE.BufferGeometry();
		pointGeo.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
		const pMat = new THREE.PointsMaterial( { 
			color:  new THREE.Color(color),
			size: size	
		});
		const point = new THREE.Points(pointGeo, pMat);
		return point
	}
	function createPoint(data, opts, ydata)  {
		const position = [];
		const indexs = [];
		const size = 10;
		const delay = opts.delay;
		// const nums = [];
		const times = [];
		data.forEach((elem) => {
			elem.forEach((_elem) => {
				const vec = _elem.clone();
				if (vec.y ==0 )return false;
				const n = Math.random() +  delay * Math.random();
				for(let i=0;i<10;i++) {
					position.push(...Utils.getValues(vec));
					 
					indexs.push(i);
					// nums.push(vec.y, vec.y + 40);
					times.push(n)
				}
			
			})
		})
		const pointGeo = new THREE.BufferGeometry();
		pointGeo.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
		pointGeo.addAttribute("u_index", new THREE.Float32BufferAttribute(indexs, 1));
		// pointGeo.addAttribute("u_nums", new THREE.Float32BufferAttribute(nums, 2));
		pointGeo.addAttribute("u_time", new THREE.Float32BufferAttribute(times, 1));
		const texture = new THREE.TextureLoader().load('./images/p3.png');
		var pMat = new THREE.ShaderMaterial({
			uniforms: {
				y_time:{ value:0 },
				time:{ value:0 },
				size:{ value:size },
				color:{ value:new THREE.Color('#ffffff') },
				texture: {
                    value: texture, 
                },
				high: { value: opts.highColor },
				center: { value: opts.centerColor },
				bottom: { value: opts.lowColor },
				u_nums: { value:new THREE.Vector2(threshold.low, threshold.hight) },
				delay: { value: delay },
				height: { value: height }
				// num: {value: new THREE.Vector2()}
			},
			transparent:true,
			// depthWrite:false,
			blending:THREE.AdditiveBlending,
			vertexShader: pointShader.vertexshader,
            fragmentShader: pointShader.fragmentshader
		});
		var starField = new THREE.Points(pointGeo, pMat);
		starField.renderOrder = 99;
		return starField
	}
	function createThreshold(obj, opts) {
		const group = new THREE.Group();
		const original = new THREE.Vector3(-width / 2, 0, -zwidth / 2);

		const hcolor = opts.highColor;
		const lcolor = opts.lowColor;

		const h1 = original.clone() 
	 	h1.y =  obj.hight;
	 	const h2 = h1.clone();
		h2.x += width;

		const l1 = original.clone() 
	 	l1.y =  obj.low;
	 	const l2 = l1.clone();
		l2.x += width;

		const lineGeo = new THREE.BufferGeometry();

		 
		const position = [];
		const color = [];
	
		position.push(h1.x, h1.y, h1.z);
		position.push(h2.x, h2.y, h2.z);
		color.push(hcolor.r, hcolor.g, hcolor.b);
		color.push(hcolor.r, hcolor.g, hcolor.b);
	
		position.push(l1.x, l1.y, l1.z);
		position.push(l2.x, l2.y, l2.z);
		color.push(lcolor.r, lcolor.g, lcolor.b);
		color.push(lcolor.r, lcolor.g, lcolor.b);

		
		
		lineGeo.addAttribute("position", new THREE.Float32BufferAttribute(position, 3));
		lineGeo.addAttribute("color", new THREE.Float32BufferAttribute(color, 3));

		var material = new THREE.ShaderMaterial({
			uniforms: {
				u_opacity: { value : 0.4}
			},
			transparent: true,
			vertexShader: lineShader.vertexshader,
            fragmentShader: lineShader.fragmentshader
		})

		var line = new THREE.LineSegments(lineGeo, material);
		group.add(line);


		return group;
	}
	thm.setColor = (name, val) => {
		switch(name) {
			case 'color':
			{
				const colorArr = Utils.getColorArr(val);
				 
				// thm.faceMesh.material.uniforms.color.value = new THREE.Vector4(...Utils.getValues(colorArr[0]), colorArr[1])
				thm.faceMesh1.material.uniforms.color.value = new THREE.Vector4(...Utils.getValues(colorArr[0]), colorArr[1])
			}
			break;
			case 'colorEnd':
			{
				const colorArr = Utils.getColorArr(val);
				// thm.faceMesh.material.uniforms.colorEnd.value = new THREE.Vector4(...Utils.getValues(colorArr[0]), colorArr[1])
				thm.faceMesh1.material.uniforms.colorEnd.value = new THREE.Vector4(...Utils.getValues(colorArr[0]), colorArr[1])
			}
			break;
			case 'lineColor':
			{
				const colorArr = Utils.getColorArr(val);
				thm.lineMesh.material.color = colorArr[0];
				thm.lineMesh.material.opacity = colorArr[1];
			}
			break; 
			case 'pointSize':
			{ 
				thm.pointMesh.material.uniforms.size.value = val; 
			}
			case 'pointColor1':
			{ 

				thm.pointMesh.material.uniforms.high.value = Utils.getColorArr(val)[0]; 
			}
			case 'pointColor2':
			{ 
				console.log(Utils.getColorArr(val))
				thm.pointMesh.material.uniforms.bottom.value =  Utils.getColorArr(val)[0]; 
			}
			break; 
		}
	}
	function createTexts(axios,  position, site) {
		const group = new THREE.Group();
		axios.forEach((elem, i) => {
			const _vec = position[i];
			const map = createText({
				text: elem.name,
				fontSize: 48
			});
			const w = map.image.width / 4;
			const h = map.image.height / 4;
			 
			const geometry = new THREE.PlaneGeometry( w, h, 1 );
			const material = new THREE.MeshBasicMaterial( {
				color: 0xffffff, 
				side: THREE.DoubleSide,
			  	map: map,
				transparent: true
			});
			const plane = new THREE.Mesh( geometry, material );
			if (site === 'left') {
				_vec.x -= w / 2 + 10; 
				plane.position.copy(_vec);
				 plane.rotation.x -=Math.PI/2
			} else {
				_vec.z -= h / 2 + w/2;
				plane.position.copy(_vec);
				plane.rotation.x = -Math.PI / 2
				plane.rotation.z = Math.PI / 2
			 
			}
			//
			group.add( plane );
		})
		return group;
	}
	// 生成文字标签纹理
	function createText(opts) {
		const { text, fontSize } = opts;
		const textLen = text.length;
		const width = (fontSize + 2) * textLen;
		const height = fontSize + 10;
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		ctx.font = fontSize + "px 微软雅黑";
		ctx.fillStyle = "#fff";
		ctx.textAlign = "left";
		const ws = ctx.measureText(text).width;
		ctx.fillText(text, (width - ws) / 2, height / 2 + fontSize / 2);
		const textur = new THREE.Texture(canvas);
		textur.needsUpdate = true;
		return textur;
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
	let time = 0.0
	function animation(dt) {
		if (dt > 1) return false;
		if (thm.faceMesh1) {
			if (thm.faceMesh1._isAnimate == 1) {
				thm.faceMesh1.material.uniforms.animat.value += dt;
				thm.linesMesh.scale.y = thm.faceMesh1.material.uniforms.animat.value;
				if (thm.faceMesh1.material.uniforms.animat.value >= 1) {
					thm.linesMesh.scale.y = 1;
					thm.faceMesh1.material.uniforms.animat.value = 1;
					thm.faceMesh1._isAnimate = false;
				}
			}
			if (thm.faceMesh1._isAnimate == 2) {
				thm.faceMesh1.material.uniforms.animat.value -= dt;
				thm.linesMesh.scale.y = thm.faceMesh1.material.uniforms.animat.value;
				if (thm.faceMesh1.material.uniforms.animat.value <= 0) {
					thm.linesMesh.scale.y = 0;
					thm.faceMesh1.material.uniforms.animat.value = 0;
					thm.faceMesh1._isAnimate = false;
				}
			}
		}
		if (thm.pointMesh) {
			const t = dt * 0.3;
			time += t ;
			if ( time >= 2.0) {
				thm.pointMesh.material.uniforms.time.value = t;
				thm.pointMesh.material.uniforms.y_time.value = time;
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
		}
	}

	function onDocumentMouseDown(event) {
		event.preventDefault();
		df_Mouse.x = (event.layerX / df_Width) * 2 - 1;
		df_Mouse.y = -(event.layerY / df_Height) * 2 + 1;
		df_Raycaster.setFromCamera(df_Mouse, thm.camera);
		var intersects = df_Raycaster.intersectObjects(rayMeshs); 
		if (intersects.length != 0 && event.buttons == 1) {
		 	const object = intersects[0].object;
			if (object.name == 'face') {
				const i = faceindex[intersects[0].faceIndex];
				const index = intersects[0].faceIndex;
				// object.material.uniforms.select.value = index - (index % 4); 
				// object.material.uniforms.select.value = index * 3;  
				// console.log(index * 3)
			} 
		} else {}

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
		var loadImg = 'data:image/gif;base64,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';
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