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
        varying vec4 vcolor;
        varying vec3 v_normal;
        varying float _y;
        float lerp(float x, float y, float t) {
            return (1.0 - t) * x + t * y;
        }
        void main() { 
            // vcolor = colorEnd;
            float y = position.y;
            float l = position.y / height;
            float r = lerp(colorEnd.r, color.r, l);
            float g = lerp(colorEnd.g, color.g, l);
            float b = lerp(colorEnd.b, color.b, l);
            float a = lerp(colorEnd.a, color.a, l);
            vcolor = vec4(r, g, b, a);
            v_normal = normalMatrix * normal;
            _y = position.y;
            vec3 v_position = vec3(position.r, position.y * 1.0, position.z);
            vec4 mvPosition = modelViewMatrix * vec4(v_position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
        }
        `,
    fragmentshader: `
        uniform float time;
        uniform vec4 color;
        uniform vec4 colorEnd;
        varying vec4 vcolor;
        uniform vec3 u_lightDirection;
        uniform vec3 u_lightColor;
        uniform vec3 u_AmbientLight;
        uniform vec4 u_highColor;
        varying vec3 v_normal;
        varying float _y;
        void main() {
            vec3 normal = normalize(v_normal);
            float nDotL = max(dot(u_lightDirection, normal), 0.0);
            vec3 diffuse = u_lightColor * vcolor.rgb * nDotL;
            vec3 ambient = u_AmbientLight * vcolor.rgb;
            vec3 gcolor = _y == 0.0 ? (ambient) : (diffuse + ambient);
            gl_FragColor = vec4(gcolor, vcolor.a); ;
        }`
}

// 假数据

const cdata = [ 
    ['保险', '保险', 20, 0],
    ['保险资管', '保险资管', 33, 0],
    ['城商行', '城商行', 0, 0],
    ['大型银行', '大型银行', 0, 0],
    ['公募资金', '公募资金', 20, 50],
    ['股份制', '股份制', 20, 50],
    ['境外产品', '境外产品', 20, 50],
    ['境外法人', '境外法人', 20, 50],
    ['农村及民营银行', '农村及民营银行', 20, 50],
    ['其他非银法人', '其他非银法人', 20, 50],
    ['其他金融机构', '其他金融机构', 20, 50],
    ['私募资管', '私募资管', 20, 50],
    ['外资行', '外资行', 20, 50],
    ['银行理财', '银行理财', 20, 60],
    ['证券公司', '证券公司', 20, 30],
    ['政策性行', '政策性行', 20, 50],
    ['其他非银法人', '保险资管', 20, 110],
    ['其他金融机构', '城商行', 12, 50],
    ['私募资管', '大型银行', 120, 50],
    ['外资行', '公募资金', 20, 50],
    ['银行理财', '股份制', 20, 50],
    ['证券公司', '境外产品', 20, 100],
    ['政策性行', '公募资金', 20, 50],
    ['政策性行', '股份制', 20, 50],
    ['其他非银法人', '境外产品', 20, 50],
    ['其他金融机构', '境外法人', 20, 50],
    ['私募资管', '农村及民营银行', 20, 50],
    ['外资行', '其他非银法人', 20, 60],
    ['保险', '其他金融机构', 20, 50],
    ['保险资管', '私募资管', 120, 50],
    ['城商行', '外资行', 20, 50],
    ['大型银行', '银行理财', -0, 50],
    ['公募资金', '证券公司', 100, 50] 
]