# apps/web/build.sh
#!/bin/bash
pnpm install
pnpm run build
# 确保构建产物在正确的位置
cp -r dist/* ../..