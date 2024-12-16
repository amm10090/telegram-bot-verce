export interface IntlMessages {
  [key: string]: string;
}

// 定义支持的语言类型
export type SupportedLocales = 'en-US' | 'zh-CN';

// 定义消息字典的类型
export type MessageDictionary = Record<SupportedLocales, IntlMessages>;
