# -*- coding: utf-8 -*-
"""Generate docs/architecture.svg and architecture.png."""
from pathlib import Path

SVG = r'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="920" viewBox="0 0 1400 920">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f1419"/>
      <stop offset="100%" style="stop-color:#1a2332"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c9a227"/>
      <stop offset="100%" style="stop-color:#e8c547"/>
    </linearGradient>
    <linearGradient id="client" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#2d4a6f"/>
      <stop offset="100%" style="stop-color:#1e3550"/>
    </linearGradient>
    <linearGradient id="server" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#3d5a4a"/>
      <stop offset="100%" style="stop-color:#2a4035"/>
    </linearGradient>
    <linearGradient id="shared" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#5a3d6e"/>
      <stop offset="100%" style="stop-color:#3d2850"/>
    </linearGradient>
    <linearGradient id="pipe" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4a3d2d"/>
      <stop offset="100%" style="stop-color:#352a20"/>
    </linearGradient>
    <filter id="shadow" x="-4%" y="-4%" width="108%" height="108%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.45"/>
    </filter>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L9,3 L0,6 Z" fill="#8ba4c4"/>
    </marker>
    <marker id="arrowGold" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L9,3 L0,6 Z" fill="#e8c547"/>
    </marker>
  </defs>

  <rect width="1400" height="920" fill="url(#bg)"/>

  <text x="700" y="48" text-anchor="middle" fill="url(#accent)" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="28" font-weight="700">遗迹吞忆 · 系统架构</text>
  <text x="700" y="78" text-anchor="middle" fill="#8ba4c4" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="14">Roguelike Card Battle — Monorepo + AI 内容管线</text>

  <rect x="40" y="100" width="1320" height="280" rx="12" fill="#121820" stroke="#2a3a4d" stroke-width="1"/>
  <text x="60" y="128" fill="#6b8aad" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12" font-weight="600" letter-spacing="2">主游戏循环（权威状态在服务端 + shared）</text>

  <g filter="url(#shadow)">
    <rect x="80" y="150" width="220" height="200" rx="10" fill="url(#client)" stroke="#4a7ab0" stroke-width="1.5"/>
    <text x="190" y="182" text-anchor="middle" fill="#e8f0fa" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="16" font-weight="700">React Client</text>
    <text x="190" y="204" text-anchor="middle" fill="#a8c4e0" font-family="Segoe UI, sans-serif" font-size="11">Vite · React 19</text>
    <line x1="100" y1="218" x2="280" y2="218" stroke="#4a7ab0" stroke-opacity="0.5"/>
    <text x="100" y="242" fill="#c8dce8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• 主菜单 / 地图 / 战斗 UI</text>
    <text x="100" y="262" fill="#c8dce8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• 美术 / 内容 / 平衡工坊</text>
    <text x="100" y="282" fill="#c8dce8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• GameProvider 只读状态</text>
    <text x="100" y="318" fill="#8ba4c4" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="10" font-style="italic">无战斗权威逻辑</text>
  </g>

  <path d="M 310 250 L 380 250" stroke="#8ba4c4" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <text x="345" y="238" text-anchor="middle" fill="#8ba4c4" font-family="Segoe UI, sans-serif" font-size="10">REST</text>

  <g filter="url(#shadow)">
    <rect x="390" y="150" width="240" height="200" rx="10" fill="url(#server)" stroke="#5a9a6e" stroke-width="1.5"/>
    <text x="510" y="182" text-anchor="middle" fill="#e8faf0" font-family="Segoe UI, sans-serif" font-size="16" font-weight="700">Express Game API</text>
    <text x="510" y="204" text-anchor="middle" fill="#a8e0c4" font-family="Segoe UI, sans-serif" font-size="11">Node.js · :3001</text>
    <line x1="410" y1="218" x2="610" y2="218" stroke="#5a9a6e" stroke-opacity="0.5"/>
    <text x="410" y="242" fill="#c8e8d8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• runs / combat / reward</text>
    <text x="410" y="262" fill="#c8e8d8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• shop / rest / event / meta</text>
    <text x="410" y="282" fill="#c8e8d8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• Zod 校验 · 自动写存档</text>
    <text x="410" y="318" fill="#8ba4a4" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="10" font-style="italic">AI 接口仅在后端</text>
  </g>

  <path d="M 640 250 L 710 250" stroke="#8ba4c4" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <text x="675" y="238" text-anchor="middle" fill="#8ba4c4" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="10">调用</text>

  <g filter="url(#shadow)">
    <rect x="720" y="150" width="280" height="200" rx="10" fill="url(#shared)" stroke="#9a6ab0" stroke-width="1.5"/>
    <text x="860" y="182" text-anchor="middle" fill="#f0e8fa" font-family="Segoe UI, sans-serif" font-size="16" font-weight="700">@rcb/shared</text>
    <text x="860" y="204" text-anchor="middle" fill="#d0b8e8" font-family="Segoe UI, sans-serif" font-size="11">packages/shared</text>
    <line x1="740" y1="218" x2="980" y2="218" stroke="#9a6ab0" stroke-opacity="0.5"/>
    <text x="740" y="242" fill="#e8d8f8" font-family="Segoe UI, sans-serif" font-size="11">• combatEngine · mapGen</text>
    <text x="740" y="262" fill="#e8d8f8" font-family="Segoe UI, sans-serif" font-size="11">• relicEngine · seedrandom</text>
    <text x="740" y="282" fill="#e8d8f8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">• Zod Schema · Power Budget</text>
    <text x="740" y="302" fill="#e8d8f8" font-family="Segoe UI, sans-serif" font-size="11">• balance simulate</text>
  </g>

  <path d="M 1010 250 L 1080 250" stroke="#e8c547" stroke-width="2" fill="none" marker-end="url(#arrowGold)"/>
  <text x="1045" y="238" text-anchor="middle" fill="#e8c547" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="10">读写</text>

  <g filter="url(#shadow)">
    <rect x="1090" y="150" width="240" height="200" rx="10" fill="#1e2835" stroke="#c9a227" stroke-width="1.5"/>
    <text x="1210" y="182" text-anchor="middle" fill="url(#accent)" font-family="Segoe UI, sans-serif" font-size="16" font-weight="700">data/ · assets/</text>
    <text x="1210" y="204" text-anchor="middle" fill="#a8b8c8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">JSON 持久化</text>
    <line x1="1110" y1="218" x2="1310" y2="218" stroke="#c9a227" stroke-opacity="0.4"/>
    <text x="1110" y="242" fill="#d0dce8" font-family="Segoe UI, sans-serif" font-size="11">• saves/{runId}.json</text>
    <text x="1110" y="262" fill="#d0dce8" font-family="Segoe UI, sans-serif" font-size="11">• cards/ classes/ relics</text>
    <text x="1110" y="282" fill="#d0dce8" font-family="Segoe UI, sans-serif" font-size="11">• meta.json · imageAssets</text>
    <text x="1110" y="302" fill="#d0dce8" font-family="Segoe UI, sans-serif" font-size="11">• balance/lastReport.json</text>
  </g>

  <rect x="40" y="410" width="1320" height="470" rx="12" fill="#121820" stroke="#2a3a4d" stroke-width="1"/>
  <text x="60" y="438" fill="#6b8aad" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12" font-weight="600" letter-spacing="2">并行 AI / 工具链（草稿 → 校验 → 入库 / 注册）</text>

  <g filter="url(#shadow)">
    <rect x="60" y="460" width="400" height="390" rx="10" fill="url(#pipe)" stroke="#b08a50" stroke-width="1.5"/>
    <text x="260" y="495" text-anchor="middle" fill="#fae8c8" font-family="Segoe UI, sans-serif" font-size="15" font-weight="700">Image Pipeline</text>
    <text x="260" y="518" text-anchor="middle" fill="#d8c0a0" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">美术工坊 · Phase 5</text>
    <rect x="85" y="540" width="350" height="44" rx="6" fill="#2a2218" stroke="#6a5a40"/>
    <text x="260" y="567" text-anchor="middle" fill="#e8dcc8" font-family="Segoe UI, sans-serif" font-size="12">imagePrompt (JSON 数据)</text>
    <path d="M 260 584 L 260 602" stroke="#b08a50" stroke-width="2" marker-end="url(#arrowGold)"/>
    <rect x="85" y="605" width="350" height="44" rx="6" fill="#2a2218" stroke="#6a5a40"/>
    <text x="260" y="632" text-anchor="middle" fill="#e8dcc8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">buildImagePrompt + 风格预设</text>
    <path d="M 260 649 L 260 667" stroke="#b08a50" stroke-width="2" marker-end="url(#arrowGold)"/>
    <rect x="85" y="670" width="350" height="44" rx="6" fill="#2a2218" stroke="#6a5a40"/>
    <text x="260" y="697" text-anchor="middle" fill="#e8dcc8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">Image API · 无 Key → SVG Fallback</text>
    <path d="M 260 714 L 260 732" stroke="#b08a50" stroke-width="2" marker-end="url(#arrowGold)"/>
    <rect x="85" y="735" width="350" height="44" rx="6" fill="#2a2218" stroke="#6a5a40"/>
    <text x="260" y="762" text-anchor="middle" fill="#e8dcc8" font-family="Segoe UI, sans-serif" font-size="12">assets/generated/…/*.png</text>
    <path d="M 260 779 L 260 797" stroke="#b08a50" stroke-width="2" marker-end="url(#arrowGold)"/>
    <rect x="85" y="800" width="350" height="40" rx="6" fill="#3d3520" stroke="#c9a227"/>
    <text x="260" y="826" text-anchor="middle" fill="#f5e6a8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12" font-weight="600">imageAssets.json → UI 只读</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="500" y="460" width="400" height="390" rx="10" fill="url(#pipe)" stroke="#6a8ab0" stroke-width="1.5"/>
    <text x="700" y="495" text-anchor="middle" fill="#e8f0fa" font-family="Segoe UI, sans-serif" font-size="15" font-weight="700">LLM Content Forge</text>
    <text x="700" y="518" text-anchor="middle" fill="#a8c4e0" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">内容工坊 · Phase 6</text>
    <rect x="525" y="540" width="350" height="44" rx="6" fill="#1e2835" stroke="#4a6a8a"/>
    <text x="700" y="567" text-anchor="middle" fill="#e8f0fa" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">theme → LLM / 模板 Fallback</text>
    <path d="M 700 584 L 700 602" stroke="#6a8ab0" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="525" y="605" width="350" height="44" rx="6" fill="#1e2835" stroke="#4a6a8a"/>
    <text x="700" y="632" text-anchor="middle" fill="#e8f0fa" font-family="Segoe UI, sans-serif" font-size="12">GeneratedClassPackSchema (Zod)</text>
    <path d="M 700 649 L 700 667" stroke="#6a8ab0" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="525" y="670" width="350" height="44" rx="6" fill="#1e2835" stroke="#4a6a8a"/>
    <text x="700" y="697" text-anchor="middle" fill="#e8f0fa" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">Power Budget 逐卡审计</text>
    <path d="M 700 714 L 700 732" stroke="#6a8ab0" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="525" y="735" width="350" height="44" rx="6" fill="#1e2835" stroke="#4a6a8a"/>
    <text x="700" y="762" text-anchor="middle" fill="#e8f0fa" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">战斗模拟 gate (greedy vs 精英)</text>
    <path d="M 700 779 L 700 797" stroke="#6a8ab0" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="525" y="800" width="350" height="40" rx="6" fill="#2a3550" stroke="#c9a227"/>
    <text x="700" y="826" text-anchor="middle" fill="#f5e6a8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12" font-weight="600">draft → approve → classes + cards/</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="940" y="460" width="400" height="390" rx="10" fill="url(#pipe)" stroke="#7a5a9a" stroke-width="1.5"/>
    <text x="1140" y="495" text-anchor="middle" fill="#f0e8fa" font-family="Segoe UI, sans-serif" font-size="15" font-weight="700">Balance Lab</text>
    <text x="1140" y="518" text-anchor="middle" fill="#d0b8e8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">平衡实验室 · Phase 7</text>
    <rect x="965" y="540" width="350" height="44" rx="6" fill="#281e35" stroke="#5a4a6a"/>
    <text x="1140" y="567" text-anchor="middle" fill="#e8d8f8" font-family="Segoe UI, sans-serif" font-size="12">classes + cards + enemies</text>
    <path d="M 1140 584 L 1140 602" stroke="#7a5a9a" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="965" y="605" width="350" height="44" rx="6" fill="#281e35" stroke="#5a4a6a"/>
    <text x="1140" y="632" text-anchor="middle" fill="#e8d8f8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">3 策略 × 普通/精英/Boss</text>
    <path d="M 1140 649 L 1140 667" stroke="#7a5a9a" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="965" y="670" width="350" height="44" rx="6" fill="#281e35" stroke="#5a4a6a"/>
    <text x="1140" y="697" text-anchor="middle" fill="#e8d8f8" font-family="Segoe UI, sans-serif" font-size="12">combatEngine 自动对战 (shared)</text>
    <path d="M 1140 714 L 1140 732" stroke="#7a5a9a" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="965" y="735" width="350" height="44" rx="6" fill="#281e35" stroke="#5a4a6a"/>
    <text x="1140" y="762" text-anchor="middle" fill="#e8d8f8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12">胜率矩阵 · Power Budget 审计</text>
    <path d="M 1140 779 L 1140 797" stroke="#7a5a9a" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="965" y="800" width="350" height="40" rx="6" fill="#352845" stroke="#c9a227"/>
    <text x="1140" y="826" text-anchor="middle" fill="#f5e6a8" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="12" font-weight="600">lastReport.json · npm run balance</text>
  </g>

  <path d="M 860 350 L 260 460" stroke="#9a6ab0" stroke-width="1.5" stroke-dasharray="6 4" fill="none" opacity="0.6"/>
  <path d="M 860 350 L 700 460" stroke="#9a6ab0" stroke-width="1.5" stroke-dasharray="6 4" fill="none" opacity="0.6"/>
  <path d="M 860 350 L 1140 460" stroke="#9a6ab0" stroke-width="1.5" stroke-dasharray="6 4" fill="none" opacity="0.6"/>
  <text x="700" y="395" text-anchor="middle" fill="#6b8aad" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">@rcb/shared 为三条管线共用逻辑与校验</text>

  <text x="700" y="912" text-anchor="middle" fill="#6b8aad" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="11">
    设计铁律：战斗真相 = combatEngine + Seed · AI 仅产草稿 · 批准/注册后才进入游戏 · 无 Key 可 Fallback
  </text>
</svg>'''

def main():
    docs = Path(__file__).resolve().parent
    svg_path = docs / "architecture.svg"
    png_path = docs / "architecture.png"
    svg_path.write_text(SVG, encoding="utf-8", newline="\n")
    print(f"Wrote {svg_path}")

    import subprocess
    import sys
    result = subprocess.run(
        ["npx", "--yes", "@resvg/resvg-js-cli", str(svg_path), str(png_path)],
        cwd=str(docs),
        capture_output=True,
        text=True,
        shell=True,
    )
    if result.returncode != 0:
        print(result.stderr or result.stdout, file=sys.stderr)
        sys.exit(result.returncode)
    print(f"Wrote {png_path} ({png_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
