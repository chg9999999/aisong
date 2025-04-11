// utils/error.ts
// 错误处理工具函数

import { ApiError } from '../types/common';

// 错误类型常量
export const ERROR_TYPES = {
  PARAM_ERROR: 'PARAM_ERROR',         // 参数错误
  AUTH_ERROR: 'AUTH_ERROR',           // 认证错误
  NETWORK_ERROR: 'NETWORK_ERROR',     // 网络错误
  SERVER_ERROR: 'SERVER_ERROR',       // 服务器错误
  CREDIT_ERROR: 'CREDIT_ERROR',       // 积分不足
  SENSITIVE_WORD_ERROR: 'SENSITIVE_WORD_ERROR', // 敏感词错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',     // 未知错误
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 输入验证错误
};

// 根据HTTP状态码创建标准错误对象
export function createApiError(status: number, message?: string, details?: any): ApiError {
  const defaultMessages: { [key: number]: string } = {
    400: '参数错误，请检查您的输入',
    401: '认证失败，请重新登录',
    404: '请求的资源不存在',
    405: '调用超过限制',
    413: '输入内容过长',
    429: '积分不足，请充值后再试',
    455: '系统维护中，请稍后再试',
    500: '服务器错误，请稍后再试',
  };

  return {
    code: status,
    message: message || defaultMessages[status] || '发生未知错误',
    details,
  };
}

// 从响应中提取API错误
export function extractApiError(response: any): ApiError {
  if (response && response.code && response.msg) {
    return {
      code: response.code,
      message: response.msg,
      details: response.data,
    };
  }
  
  return createApiError(500, '未能解析错误响应');
}

// 处理API响应错误
export function handleApiError(error: any): ApiError {
  // 如果已经是ApiError类型，直接返回
  if (error && typeof error.code === 'number' && typeof error.message === 'string') {
    return error as ApiError;
  }
  
  // 处理Axios或Fetch错误
  if (error.response) {
    // 服务器响应了错误状态码
    const { status } = error.response;
    let apiError: ApiError;
    
    // 尝试从响应中提取详细错误信息
    try {
      const errorData = error.response.data;
      apiError = extractApiError(errorData);
    } catch (_) {
      apiError = createApiError(status);
    }
    
    return apiError;
  } else if (error.request) {
    // 请求已发送但没有收到响应
    return createApiError(0, '网络错误，无法连接到服务器', { 
      type: ERROR_TYPES.NETWORK_ERROR,
    });
  } else {
    // 发送请求时出错
    return createApiError(0, error.message || '请求发送失败', { 
      type: ERROR_TYPES.UNKNOWN_ERROR,
    });
  }
}

// 参数验证错误
export class ValidationError extends Error {
  public details: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = ERROR_TYPES.VALIDATION_ERROR;
    this.details = details;
  }
}

// 检查参数是否有效
export function validateRequiredParams(params: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !params[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `缺少必要参数: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

// 参数长度校验
export function validateParamLength(
  param: string | undefined, 
  maxLength: number, 
  paramName: string
): void {
  if (param && param.length > maxLength) {
    throw new ValidationError(
      `参数 ${paramName} 长度超过限制，最大长度为 ${maxLength}`,
      { param: paramName, maxLength, actualLength: param.length }
    );
  }
}

// 自定义模式下的参数校验
export function validateCustomModeParams(params: {
  customMode?: boolean,
  instrumental?: boolean,
  prompt?: string,
  style?: string,
  title?: string
}): void {
  const { customMode, instrumental, prompt, style, title } = params;
  
  if (!customMode) {
    // 非自定义模式仅需要prompt
    if (!prompt) {
      throw new ValidationError('非自定义模式下，prompt参数必填');
    }
    validateParamLength(prompt, 400, 'prompt');
    return;
  }
  
  // 自定义模式校验
  if (instrumental) {
    // 纯器乐模式需要style和title
    if (!style) {
      throw new ValidationError('自定义纯器乐模式下，style参数必填');
    }
    if (!title) {
      throw new ValidationError('自定义纯器乐模式下，title参数必填');
    }
  } else {
    // 带人声模式需要prompt、style和title
    if (!prompt) {
      throw new ValidationError('自定义带人声模式下，prompt参数必填');
    }
    if (!style) {
      throw new ValidationError('自定义带人声模式下，style参数必填');
    }
    if (!title) {
      throw new ValidationError('自定义带人声模式下，title参数必填');
    }
  }
  
  // 长度校验
  validateParamLength(prompt, 3000, 'prompt');
  validateParamLength(style, 200, 'style');
  validateParamLength(title, 80, 'title');
}

// 将错误转换为用户友好的消息
export function formatErrorForUser(error: ApiError | Error): string {
  if ('code' in error) {
    const apiError = error as ApiError;
    
    // 处理特定错误码
    switch (apiError.code) {
      case 429:
        return '您的积分不足，请充值后重试';
      case 413:
        return '输入内容过长，请减少内容后重试';
      case 455:
        return '系统正在维护中，请稍后再试';
      default:
        return apiError.message;
    }
  } else if (error instanceof ValidationError) {
    return error.message;
  } else {
    return error.message || '发生未知错误';
  }
} 