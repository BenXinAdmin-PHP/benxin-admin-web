/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   UnoCSS 原子化样式配置
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import { defineConfig, presetWind3, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    // Tailwind/Windi 兼容的工具类预设
    presetWind3(),
    // 支持属性化写法，如 <div text-red flex />
    presetAttributify(),
    // 图标预设：仅使用开源可商用图标集（按需在 package.json 安装 @iconify-json/*）
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    // 字体优先系统字体栈（资源合规：不引入商用字库）
    fontFamily: {
      sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
    },
  },
})
