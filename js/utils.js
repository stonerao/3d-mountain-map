const Utils = {
    getValues(obj) {
        return Object.values(obj);
    },
    getColorArr(str) {
        if (Array.isArray(str)) return str; //error
        var _arr = [];
        str = str + '';
        str = str.toLowerCase().replace(/\s/g, "");
        if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
            var arr = str.replace(/rgba\(|\)/gi, '').split(',');
            var hex = [
                pad2(Math.round(arr[0] * 1 || 0).toString(16)),
                pad2(Math.round(arr[1] * 1 || 0).toString(16)),
                pad2(Math.round(arr[2] * 1 || 0).toString(16))
            ];
            _arr[0] = new THREE.Color('#' + hex.join(""));
            _arr[1] = Math.max(0, Math.min(1, (arr[3] * 1 || 0)));
        } else if ('transparent' === str) {
            _arr[0] = new THREE.Color();
            _arr[1] = 0;
        } else {
            _arr[0] = new THREE.Color(str);
            _arr[1] = 1;
        }

        function pad2(c) {
            return c.length == 1 ? '0' + c : '' + c;
        }
        return _arr;
    },
    lerp: function (x, y, t) {

        return (1 - t) * x + t * y;

    },
    QuarticIn(k) {
        return k * k * k * k;
    },
    getVecCenter(src, dst) {
        return src.clone().lerp(dst, 0.5);
    },
    getMinMax(arr) {
        let min = arr[0];
        let max = arr[0];
        arr.forEach(num => {
            min = num < min ? num : min;
            max = num > num ? num : max;
        });
        return {
            max, min
        }
    }
};

var faceShader = {
    vertexshader: ` 
        uniform float time;
        uniform float height;
        uniform float animat;
        uniform float select;
        uniform float colorNum; 
        uniform vec4 color;
        uniform vec4 colorEnd;
        uniform vec4 selectEnd;
        uniform vec4 selectStart;
        
        varying vec4 vcolor;
        varying vec3 v_normal;
        varying float _y;
        varying vec3 va_position;
        attribute float u_index;
        float lerp(float x, float y, float t) {
            return (1.0 - t) * x + t * y;
        }
        void main() { 
            vec4 end = u_index == select ? selectEnd : colorEnd;
            vec4 start = u_index == select ? selectStart : color;
            float y = abs(position.y);
          
            vec3 v_position = vec3(position.r, position.y * animat, position.z);
            _y = v_position.y;
            va_position = v_position;
            vec4 mvPosition = modelViewMatrix * vec4(v_position, 1.0); 
            v_normal = _y == 0.0 ? vec3(.0,.0,.0) :normalMatrix * normal;
             
            gl_Position = projectionMatrix * mvPosition;
        }
        `,
    fragmentshader: `
        uniform vec3 colorArr[NUM_DISTINCT];
        uniform vec3 u_point[NUM_POINT];
        uniform float u_pointVal[NUM_POINT];
        uniform float time;
        uniform float colorNum;
        uniform float height;
        uniform vec4 color;
        uniform vec4 colorEnd;
        uniform vec3 u_lightDirection;
        uniform vec3 u_lightColor;
        uniform vec3 u_AmbientLight;
        uniform vec4 u_highColor;
        uniform vec3 u_pointColor;
        varying vec4 vcolor;
        varying vec3 v_normal;
        varying float _y;
        varying vec3 va_position;
        float lerp(float x, float y, float t) {
            return (1.0 - t) * x + t * y;
        }
        float getLength(float x, float y, float x1, float y1){
            return  abs(sqrt((x-x1)*(x-x1)+(y-y1)*(y-y1)));
        }
        void main() {
            float PI = 3.131526;
            vec3 tt_color = vec3(1.0,1.0,1.0);
            float curI = _y / height;
            if (colorNum != 0.0) {
                float baseH = height / colorNum;
                float colorMod = mod(_y, baseH);
                int bcolorIndex = int(floor((height - _y) / baseH));
                for (int i = 0; i < NUM_DISTINCT; i++){
                    vec3 t_color = colorArr[i];
                    int index = int(i - 1);
                    if (index < NUM_DISTINCT && i == bcolorIndex) {
                        vec3 d_color = colorArr[i - 1];
                        if (i == 0) {
                            d_color = t_color;
                        } 
                        float t_i = colorMod / baseH; 
                        float r = lerp(t_color.r, d_color.r, t_i);
                        float g = lerp(t_color.g, d_color.g, t_i);
                        float b = lerp(t_color.b, d_color.b, t_i);  
                        tt_color = vec3(r, g, b);
                    }  
                };
            } 
            vec3 active_color = vec3(1.0,1.0,1.0);
            vec3 dst_color = _y < 1.0 ? colorArr[NUM_DISTINCT - 1] : tt_color;
            float clength = mod(time, 8.0);
            for (int i = 0; i < NUM_POINT; i++) {
                vec3 pointVec = u_point[i];
                float pointval = u_pointVal[i];
                float len = getLength(pointVec.x, pointVec.z, va_position.x, va_position.z);
                if (pointval != 0.0) {
                    if (len < 10.0 * pointval) {
                        float r = lerp(u_pointColor.r, dst_color.r, pointval);
                        float g = lerp(u_pointColor.g, dst_color.g, pointval);
                        float b = lerp(u_pointColor.b, dst_color.b, pointval); 
                        dst_color = vec3(r, g, b);
                    }
                }
            }
            // dst_color *= active_color;
            vec3 normal = normalize(v_normal);
            float nDotL = max(dot(u_lightDirection, normal), 0.0);
            vec3 diffuse = u_lightColor * dst_color * nDotL;
            vec3 ambient = u_AmbientLight * dst_color;
            vec3 gcolor = diffuse + ambient;
            gl_FragColor = vec4(dst_color, 1.0); ;
        }`
}

var pointShader = {
    vertexshader: ` 
        uniform float size; 
        uniform float time; 
        uniform float delay; 
        uniform float y_time; 
        uniform float dst_time; 
        uniform float height; 
        attribute float u_index;
        attribute float u_time;
        attribute float u_data;
        attribute float a_sizes;
        uniform vec2 u_nums;
        uniform vec3 high;
        uniform vec3 center;
        uniform vec3 bottom;
        varying vec3 v_color;
        varying float u_opacity;
        void main() {
            float f_size  = a_sizes;
            float d_time = dst_time + y_time;
            float end_time = mod(d_time + u_time * 5.0 - time * u_index, delay + 1.0) - delay; 
            if (end_time <= 0.0) {
                u_opacity = 1.0;
                end_time = 0.0;
            } else {
                u_opacity = 1.0; 
            }
            float y = position.y - end_time * position.y + u_time * f_size ;
            if (u_data < u_nums.y && u_data > u_nums.x) {
                v_color = center;
            } else if (u_data > u_nums.y) {
                v_color = high;
                f_size = f_size * 1.3;
            } else {
                v_color = bottom;
            }
            if (d_time < 0.5 || y >  position.y) {
                y = position.y;
            }
            vec3 u_position = vec3(position.x, y, position.z);
            vec4 mvPosition = modelViewMatrix * vec4(u_position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = f_size * (1.0 - u_index / 10.0) * 300.0 / (-mvPosition.z);
        }
        `,
    fragmentshader: `
        uniform vec3 color;
        uniform sampler2D texture;
        varying vec3 v_color;
        varying float u_opacity;
        void main() {
            gl_FragColor = vec4(v_color, u_opacity) * texture2D(texture, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
        }`
}


var lineShader = {
    vertexshader: ` 
        attribute vec3 color;
        varying vec3 v_color;
        void main() {
            v_color = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            // gl_PointSize = size* (1.0 - u_index / 10.0) * 300.0 / (-mvPosition.z);
        }
        `,
    fragmentshader: `
        varying vec3 v_color;
        uniform float u_opacity;
        void main() {
            gl_FragColor = vec4(v_color, u_opacity);
        }`
}

// 假数据

const cdata = [ 
    ['保险', '保险', 23, 150],
    ['保险', '保险资管', 10, 150],
    ['保险资管', '保险资管', 20, 120], 
    ['保险资管', '保险', 30, 120],
    ['保险资管', '城商行', 40, 120],
    ['城商行', '保险资管', 40, 120],
    ['城商行', '城商行', 40, 120],
    ['城商行', '保险', 30, 120],
    ['大型银行', '大型银行', 20, 80],
    ['公募资金', '公募资金', 40, 50],
    ['公募资金', '大型银行', 40, 50],
    ['股份制', '股份制', 20, 50],
    ['境外产品', '境外产品', 20, 50],
    ['境外法人', '境外法人', 0, 50],
    ['农村及民营银行', '农村及民营银行', 20, 50],
    ['其他非银法人', '其他非银法人', 20, 50],
    ['其他金融机构', '其他金融机构', 40, 80],
    ['私募资管', '私募资管', 20, 50],
    ['外资行', '外资行', 20, 50],
    ['银行理财', '银行理财', 40, 60],
    ['证券公司', '证券公司', 20, 80],
    ['政策性行', '证券公司', 20, 80],
    ['政策性行', '政策性行', 40, 50],
    ['其他非银法人', '保险资管', 20, 110],
    ['其他金融机构', '城商行', 12, 50],
    ['私募资管', '大型银行', 120, 80],
    ['外资行', '公募资金', 20, 50],
    ['银行理财', '股份制', 3, 50],
    ['证券公司', '境外产品', 20, 100],
    ['证券公司', '外资行', 20, 100],
    ['政策性行', '公募资金', 20, 80],
    ['政策性行', '股份制', 20, 50],
    ['其他非银法人', '境外产品', 40, 50],
    ['其他金融机构', '境外法人', 20, 80],
    ['私募资管', '农村及民营银行', 20, 80],
    ['外资行', '其他非银法人', 20, 60],
    ['保险', '其他金融机构', 20, 80],
    ['保险资管', '私募资管', 120, 80],
    ['城商行', '外资行', 20, 50],
    ['大型银行', '银行理财', 0, 80],
    ['公募资金', '证券公司', 100, 50] ,
    ['公募资金', '银行理财', 100, 50] ,
    ['外资行', '银行理财', 100, 50] ,
    ['其他金融机构', '银行理财', 100, 50] 
]