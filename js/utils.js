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
    }
};

var faceShader = {
    vertexshader: ` 
        uniform float time;
        uniform float height;
        uniform vec4 color;
        uniform vec4 colorEnd;
        uniform float animat;
        uniform float select;
        varying vec4 vcolor;
        uniform vec4 selectEnd;
        uniform vec4 selectStart;
        varying vec3 v_normal;
        varying float _y;
        attribute float u_index;
        float lerp(float x, float y, float t) {
            return (1.0 - t) * x + t * y;
        }
        void main() { 
            vec4 end = u_index == select ? selectEnd : colorEnd;
            vec4 start = u_index == select ? selectStart : color;
            float y = abs(position.y);
            float l = y / height;
            float r = lerp(end.r, start.r, l);
            float g = lerp(end.g, start.g, l);
            float b = lerp(end.b, start.b, l);
            float a = lerp(end.a, start.a, l);
            vcolor = vec4(r, g, b, a);
            vec3 v_position = vec3(position.r, position.y * animat, position.z);
            _y = v_position.y;
            vec4 mvPosition = modelViewMatrix * vec4(v_position, 1.0); 
            v_normal = _y == 0.0 ? vec3(.0,.0,.0) :normalMatrix * normal;
             
            gl_Position = projectionMatrix * mvPosition;
        }
        `,
    fragmentshader: `
        uniform float time;
        uniform vec4 color;
        uniform vec4 colorEnd;
        uniform vec3 u_lightDirection;
        uniform vec3 u_lightColor;
        uniform vec3 u_AmbientLight;
        uniform vec4 u_highColor;
        varying vec4 vcolor;
        varying vec3 v_normal;
        varying float _y;
        void main() {
            vec3 normal = normalize(v_normal);
            float nDotL = max(dot(u_lightDirection, normal), 0.0);
            vec4 dst_color =  _y == 0.0 ? colorEnd : vcolor;
            vec3 diffuse = u_lightColor * dst_color.rgb * nDotL;
            vec3 ambient = u_AmbientLight * dst_color.rgb;
            vec3 gcolor = diffuse + ambient;
            gl_FragColor = vec4(gcolor, vcolor.a); ;
        }`
}

var pointShader = {
    vertexshader: ` 
        uniform float size; 
        uniform float time; 
        uniform float y_time; 
        attribute float u_index;
        attribute vec2 u_nums;
        attribute float u_time;
        uniform vec3 high;
        uniform vec3 center;
        uniform vec3 bottom;
        varying vec3 v_color;
        void main() {
            float py = abs(sin((y_time - (time * u_index * size / 8.0)) + u_time)) * 1.3;
            float y = position.y * py;
            if (y < u_nums.y && y > u_nums.x) {
                v_color = center;
            } else if (y > u_nums.y) {
                v_color = high;
            } else {
                v_color = bottom;
            }
             
            vec3 u_position = vec3(position.x, y, position.z);
            vec4 mvPosition = modelViewMatrix * vec4(u_position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = size* (1.0 - u_index / 10.0) * 300.0 / (-mvPosition.z);
        }
        `,
    fragmentshader: `
        uniform vec3 color;
        uniform sampler2D texture;
        varying vec3 v_color;
        void main() {
            float u_opacity = 1.0;
            gl_FragColor = vec4(v_color, u_opacity) * texture2D(texture, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
        }`
}

// 假数据

const cdata = [ 
    ['保险', '保险', 10, 150],
    ['保险资管', '保险资管', 20, 120],
    ['城商行', '城商行', 80, 120],
    ['大型银行', '大型银行', -20, 80],
    ['公募资金', '公募资金', 40, 50],
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
    ['政策性行', '政策性行', 40, 50],
    ['其他非银法人', '保险资管', 20, 110],
    ['其他金融机构', '城商行', 12, 50],
    ['私募资管', '大型银行', 120, 80],
    ['外资行', '公募资金', 20, 50],
    ['银行理财', '股份制', 3, 50],
    ['证券公司', '境外产品', 20, 100],
    ['政策性行', '公募资金', 20, 80],
    ['政策性行', '股份制', 20, 50],
    ['其他非银法人', '境外产品', 40, 50],
    ['其他金融机构', '境外法人', 20, 80],
    ['私募资管', '农村及民营银行', 20, 80],
    ['外资行', '其他非银法人', 20, 60],
    ['保险', '其他金融机构', -20, 80],
    ['保险资管', '私募资管', -120, 80],
    ['城商行', '外资行', 20, 50],
    ['大型银行', '银行理财', 0, 80],
    ['公募资金', '证券公司', 100, 50] 
]