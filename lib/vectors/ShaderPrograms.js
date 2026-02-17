/**
 * 顶点着色器 - 点
 */
export const POINT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute vec4 a_color;
  
  uniform vec2 u_resolution;
  uniform float u_zoom;
  
  varying vec4 v_color;
  
  void main() {
    // 将地理坐标转换为裁剪空间坐标
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    gl_PointSize = a_size * u_zoom;
    v_color = a_color;
  }
`;
/**
 * 片段着色器 - 点
 */
export const POINT_FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec4 v_color;
  
  void main() {
    // 创建圆形点
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }
    gl_FragColor = v_color;
  }
`;
/**
 * 顶点着色器 - 线
 */
export const LINE_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec4 a_color;
  
  uniform vec2 u_resolution;
  
  varying vec4 v_color;
  
  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = a_color;
  }
`;
/**
 * 片段着色器 - 线
 */
export const LINE_FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec4 v_color;
  
  void main() {
    gl_FragColor = v_color;
  }
`;
/**
 * 顶点着色器 - 面
 */
export const POLYGON_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec4 a_color;
  
  uniform vec2 u_resolution;
  
  varying vec4 v_color;
  
  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = a_color;
  }
`;
/**
 * 片段着色器 - 面
 */
export const POLYGON_FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec4 v_color;
  
  void main() {
    gl_FragColor = v_color;
  }
`;
/**
 * 颜色转换工具
 */
export class ColorUtils {
    /**
     * 将十六进制颜色转换为 RGBA
     */
    static hexToRgba(hex, opacity = 1.0) {
        // 移除 # 前缀
        hex = hex.replace('#', '');
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        }
        else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        else {
            throw new Error('Invalid hex color format');
        }
        return [r / 255, g / 255, b / 255, opacity];
    }
    /**
     * 将 CSS 颜色名称转换为 RGBA
     */
    static cssToRgba(css, opacity = 1.0) {
        if (css.startsWith('#')) {
            return this.hexToRgba(css, opacity);
        }
        else if (css.startsWith('rgb(')) {
            const values = css.match(/\d+/g);
            if (values && values.length >= 3) {
                return [
                    parseInt(values[0]) / 255,
                    parseInt(values[1]) / 255,
                    parseInt(values[2]) / 255,
                    opacity,
                ];
            }
        }
        else if (css.startsWith('rgba(')) {
            const values = css.match(/[\d.]+/g);
            if (values && values.length >= 4) {
                return [
                    parseInt(values[0]) / 255,
                    parseInt(values[1]) / 255,
                    parseInt(values[2]) / 255,
                    parseFloat(values[3]) * opacity,
                ];
            }
        }
        // 默认颜色
        return [0, 0, 0, opacity];
    }
}
//# sourceMappingURL=ShaderPrograms.js.map