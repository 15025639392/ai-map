/**
 * 顶点着色器 - 点
 */
export declare const POINT_VERTEX_SHADER = "\n  attribute vec2 a_position;\n  attribute float a_size;\n  attribute vec4 a_color;\n  \n  uniform vec2 u_resolution;\n  uniform float u_zoom;\n  \n  varying vec4 v_color;\n  \n  void main() {\n    // \u5C06\u5730\u7406\u5750\u6807\u8F6C\u6362\u4E3A\u88C1\u526A\u7A7A\u95F4\u5750\u6807\n    vec2 zeroToOne = a_position / u_resolution;\n    vec2 zeroToTwo = zeroToOne * 2.0;\n    vec2 clipSpace = zeroToTwo - 1.0;\n    \n    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n    gl_PointSize = a_size * u_zoom;\n    v_color = a_color;\n  }\n";
/**
 * 片段着色器 - 点
 */
export declare const POINT_FRAGMENT_SHADER = "\n  precision mediump float;\n  \n  varying vec4 v_color;\n  \n  void main() {\n    // \u521B\u5EFA\u5706\u5F62\u70B9\n    vec2 coord = gl_PointCoord - vec2(0.5);\n    float dist = length(coord);\n    if (dist > 0.5) {\n      discard;\n    }\n    gl_FragColor = v_color;\n  }\n";
/**
 * 顶点着色器 - 线
 */
export declare const LINE_VERTEX_SHADER = "\n  attribute vec2 a_position;\n  attribute vec4 a_color;\n  \n  uniform vec2 u_resolution;\n  \n  varying vec4 v_color;\n  \n  void main() {\n    vec2 zeroToOne = a_position / u_resolution;\n    vec2 zeroToTwo = zeroToOne * 2.0;\n    vec2 clipSpace = zeroToTwo - 1.0;\n    \n    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n    v_color = a_color;\n  }\n";
/**
 * 片段着色器 - 线
 */
export declare const LINE_FRAGMENT_SHADER = "\n  precision mediump float;\n  \n  varying vec4 v_color;\n  \n  void main() {\n    gl_FragColor = v_color;\n  }\n";
/**
 * 顶点着色器 - 面
 */
export declare const POLYGON_VERTEX_SHADER = "\n  attribute vec2 a_position;\n  attribute vec4 a_color;\n  \n  uniform vec2 u_resolution;\n  \n  varying vec4 v_color;\n  \n  void main() {\n    vec2 zeroToOne = a_position / u_resolution;\n    vec2 zeroToTwo = zeroToOne * 2.0;\n    vec2 clipSpace = zeroToTwo - 1.0;\n    \n    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n    v_color = a_color;\n  }\n";
/**
 * 片段着色器 - 面
 */
export declare const POLYGON_FRAGMENT_SHADER = "\n  precision mediump float;\n  \n  varying vec4 v_color;\n  \n  void main() {\n    gl_FragColor = v_color;\n  }\n";
/**
 * 颜色转换工具
 */
export declare class ColorUtils {
    /**
     * 将十六进制颜色转换为 RGBA
     */
    static hexToRgba(hex: string, opacity?: number): [number, number, number, number];
    /**
     * 将 CSS 颜色名称转换为 RGBA
     */
    static cssToRgba(css: string, opacity?: number): [number, number, number, number];
}
//# sourceMappingURL=ShaderPrograms.d.ts.map