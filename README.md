# ParticleGarden 粒子花园

ParticleGarden 是一个基于 Three.js 与 MediaPipe Hands 的实时粒子交互实验。通过普通摄像头捕捉手势，2 万颗粒子可以在多种形态之间流动、散开或聚拢，非常适合互动展示、装置艺术或大屏演示的概念验证。

## 功能亮点
- **实时手势驱动**：MediaPipe Hands 跟踪单手 21 个关键点，利用张开/握拳程度与屏幕位置，控制粒子的旋转、收缩与爆炸效果。
- **多形态粒子雕塑**：内置 `heart`、`sphere`、`torus`、`flower`、`fireworks` 五种造型，可一键切换，并用轻微噪声让粒子显得更具生命力。
- **高密度视觉表现**：默认 20,000 粒子，结合加色混合、雾效与像素比限制，让普通设备也能保持稳定帧率。
- **交互式 UI**：磨砂玻璃面板包含形态按钮、颜色拾取器、状态提示与全屏按钮，配合加载提示与手势状态文本，方便调试。

## 技术栈
- [Three.js](https://threejs.org/)：负责 WebGL 场景、粒子系统与相机。
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)：提供实时手部关键点检测与摄像头封装。
- 原生 HTML / CSS / JavaScript：无需构建工具，直接部署即可运行。

## 快速开始
1. 克隆或下载本仓库并进入目录。
   ```bash
   git clone <repo-url>
   cd ParticleGarden
   ```
2. 启动任意静态服务器（浏览器安全策略不允许 `file://` 访问摄像头）。
   ```bash
   # npm
   npx http-server .

   # 或 Python
   python -m http.server 8080
   ```
3. 打开 `http://localhost:8080`（或你设置的端口），按照浏览器提示授权摄像头，即可看到粒子响应手势。

> 只有在安全来源（HTTPS 或 `http://localhost`）下浏览器才允许调用摄像头；若拒绝授权，MediaPipe 将无法获取手势数据。

## 使用指南
- **手势控制**：手掌张开 (`handFactor≈0`) 会让粒子向外喷薄，握拳 (`handFactor≈1`) 会让粒子收拢成形；在摄像头前左右/上下移动手掌还能轻微影响粒子整体的旋转。
- **形态切换**：右上角按钮触发 `script.js` 中的 `morphTo`，可以在心形、球体、花瓣曲线、三叶结与烟花散射之间即时切换。
- **颜色与全屏**：颜色拾取器直接修改粒子材质颜色；点击 “全屏模式” 按钮可切至沉浸式展示，再次点击或按 `Esc` 退出。
- **状态反馈**：`#status` 在 MediaPipe 初始化完成后会显示 “系统就绪”，`#gesture-val` 会提示当前识别到的手势状态，便于现场排查。

## 自定义扩展
- `script.js`：通过 `particleCount`、`createParticles()` 与 `calculateTargets()` 调整粒子数量、初始形态或新增造型；在 `morphTo()` 中绑定更多按钮即可扩展交互。
- `style.css`：调整磨砂玻璃 UI、加载提示、全屏按钮等视觉风格，适配不同主题或屏幕尺寸。
- 若需要更复杂的动画，可在 `animate()` 中增加噪声函数、时间线驱动或引入 `THREE.ShaderMaterial`，打造更高级的粒子特效。

## 目录结构
```
ParticleGarden/
├─ index.html    # 页面骨架与 CDN 资源引用
├─ style.css     # UI 与全屏布局
├─ script.js     # Three.js 粒子系统与 MediaPipe 交互逻辑
└─ README.md
```

欢迎 fork、使用或提交 Issue / PR，一起让粒子花园更加绚烂！
