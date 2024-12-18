// 声明模块类型，确保 TypeScript 能够正确识别导入的文件
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

// 扩展 Window 接口，添加可能需要的全局属性
interface Window {
  // 添加你需要的全局属性
}

// 声明全局变量
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  };
};