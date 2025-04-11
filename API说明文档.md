# Suno API 接口说明文档

## 目录

1. [通用说明](#通用说明)
2. [音频生成](#音频生成)
3. [音频扩展](#音频扩展)
4. [歌词生成](#歌词生成)
5. [带时间戳歌词](#带时间戳歌词)
6. [WAV格式转换](#wav格式转换)
7. [人声分离](#人声分离)
8. [MP4视频生成](#mp4视频生成)
9. [查询剩余积分](#查询剩余积分)
10. [回调处理与任务状态](#回调处理与任务状态)
11. [错误处理与故障排除](#错误处理与故障排除)

## 通用说明

### 基本信息

- **基础URL**: `https://apibox.erweima.ai`
- **认证方式**: Bearer Token (在请求头中添加 `Authorization: Bearer <token>`)
- **请求格式**: JSON
- **响应格式**: JSON

### 状态码说明

所有请求通用的返回状态码：

| 状态码 | 说明 |
| ------ | ---- |
| ✅ 200 | 请求成功 |
| ⚠️ 400 | 参数错误 |
| ⚠️ 401 | 没有访问权限 |
| ⚠️ 404 | 请求方式或者路径错误 |
| ⚠️ 405 | 调用超过限制 |
| ⚠️ 413 | 主题或者prompt过长 |
| ⚠️ 429 | 积分不足 |
| ⚠️ 455 | 网站维护 |
| ❌ 500 | 服务器异常 |

### 任务状态说明

注意：不同接口可能使用`status`或`successFlag`字段返回任务状态

| 状态值 | 说明 |
| ------ | ---- |
| PENDING | 待执行 |
| SUCCESS | 生成成功 |
| TEXT_SUCCESS | 生成文本成功 |
| FIRST_SUCCESS | 第一首歌生成成功 |
| CREATE_TASK_FAILED | 创建任务失败 |
| GENERATE_AUDIO_FAILED | 生成歌曲失败 |
| GENERATE_LYRICS_FAILED | 生成歌词失败 |
| GENERATE_WAV_FAILED | 生成WAV失败 |
| GENERATE_MP4_FAILED | 生成MP4失败 |
| CALLBACK_EXCEPTION | 回调异常 |
| SENSITIVE_WORD_ERROR | 敏感词报错 |

### 通用回调说明

- 所有类型的任务完成后，系统都会发送回调通知
- 回调URL通过请求参数中的`callBackUrl`字段指定
- 回调请求方法均为`POST`，数据格式为JSON
- 不同类型的任务回调结构有所不同，详见各接口说明

## 音频生成

### 创建音频生成任务

创建一个新的音频生成任务，可以根据提示词生成音乐内容。

**请求URL**：`/api/v1/generate`

**请求方法**：POST

**积分消耗**：20积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| prompt | string | 是 | 音乐生成提示词 |
| style | string | 否 | 音乐风格 |
| title | string | 否 | 音乐标题 |
| customMode | boolean | 否 | 是否使用自定义模式 |
| instrumental | boolean | 否 | 是否为纯器乐，true表示生成不含人声的纯音乐 |
| model | string | 否 | 模型版本，可选值：V3_5、V4 |
| negativeTags | string | 否 | 负面标签，用于过滤不需要的元素 |
| callBackUrl | string | 否 | 回调URL |

**参数详情说明**：
* 当customMode为true（自定义模式）时：
  * 如果instrumental为true：style和title是必需的
  * 如果instrumental为false：style、prompt和title都是必需的
  * prompt长度限制：3000字符
  * style长度限制：200字符
  * title长度限制：80字符
* 当customMode为false（非自定义模式）时：
  * 只需要prompt参数，无论instrumental设置如何
  * prompt长度限制：400字符
  * 其他参数应留空

**请求示例**：
```json
{
  "prompt": "A calm and relaxing piano track with soft melodies",
  "style": "Classical",
  "title": "Peaceful Piano Meditation",
  "customMode": true,
  "instrumental": true,
  "model": "V3_5",
  "negativeTags": "Relaxing Piano",
  "callBackUrl": "https://api.example.com/callback"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "b9a3e25c0439ff1dbf2d58d74a71d474"
  }
}
```

**回调数据示例**：
```json
{
  "code": 200,
  "msg": "All generated successfully.",
  "data": {
    "callbackType": "complete",
    "task_id": "2fac****9f72",
    "data": [
      {
        "id": "8551****662c",
        "audio_url": "https://example.cn/****.mp3",
        "source_audio_url": "https://example.cn/****.mp3",
        "stream_audio_url": "https://example.cn/****",
        "source_stream_audio_url": "https://example.cn/****",
        "image_url": "https://example.cn/****.jpeg",
        "source_image_url": "https://example.cn/****.jpeg",
        "prompt": "[Verse] 夜晚城市 灯火辉煌",
        "model_name": "chirp-v3-5",
        "title": "钢铁侠",
        "tags": "electrifying, rock",
        "createTime": "2025-01-01 00:00:00",
        "duration": 198.44
      },
      {
        "id": "bd15****1873",
        "audio_url": "https://example.cn/****.mp3",
        "source_audio_url": "https://example.cn/****.mp3",
        "stream_audio_url": "https://example.cn/****",
        "source_stream_audio_url": "https://example.cn/****",
        "image_url": "https://example.cn/****.jpeg",
        "source_image_url": "https://example.cn/****.jpeg",
        "prompt": "[Verse] 夜晚城市 灯火辉煌",
        "model_name": "chirp-v3-5",
        "title": "钢铁侠",
        "tags": "electrifying, rock",
        "createTime": "2025-01-01 00:00:00",
        "duration": 228.28
      }
    ]
  }
}
```

**注意事项**：
1. 生成的音频文件将保留15天，请及时下载
2. 音乐生成有三种回调阶段：text（生成文本）、first（第一首歌生成）和complete（全部完成）
3. 在某些情况下，系统可能会跳过text和first阶段，直接返回complete阶段的回调
4. 使用`instrumental=true`参数可以生成纯器乐，没有人声
5. 一次请求可能生成多个音频版本，在回调的`data`数组中返回

### 查询音频生成任务详情

根据任务ID查询音频生成任务的详细信息，包括生成状态、参数和结果等。

**请求URL**：`/api/v1/generate/record-info`

**请求方法**：GET

**积分消耗**：0积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 任务ID |

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5c79****be8e",
    "parentMusicId": "",
    "param": "{\"prompt\":\"A calm piano track\",\"style\":\"Classical\",\"title\":\"Peaceful Piano\",\"customMode\":true,\"instrumental\":true,\"model\":\"V3_5\"}",
    "response": {
      "taskId": "5c79****be8e",
      "sunoData": [
        {
          "id": "8551****662c",
          "audioUrl": "https://example.cn/****.mp3",
          "streamAudioUrl": "https://example.cn/****",
          "imageUrl": "https://example.cn/****.jpeg",
          "prompt": "[Verse] 夜晚城市 灯火辉煌",
          "modelName": "chirp-v3-5",
          "title": "钢铁侠",
          "tags": "electrifying, rock",
          "createTime": "2025-01-01 00:00:00",
          "duration": 198.44
        }
      ]
    },
    "status": "SUCCESS",
    "type": "GENERATE",
    "errorCode": null,
    "errorMessage": null
  }
}
```

**状态说明**：
- PENDING: 待执行
- TEXT_SUCCESS: 生成文本成功
- FIRST_SUCCESS: 第一首歌生成成功
- SUCCESS: 生成成功
- CREATE_TASK_FAILED: 创建任务失败
- GENERATE_AUDIO_FAILED: 生成歌曲失败
- CALLBACK_EXCEPTION: 回调异常
- SENSITIVE_WORD_ERROR: 敏感词报错

**注意事项**：
- 对于使用`instrumental=true`（纯器乐模式）创建的任务，响应中不会包含歌词数据，因为这是纯器乐曲目

## 音频扩展

### 创建音频扩展生成任务

基于已有的音频创建扩展生成任务，可以将现有音频片段继续延伸生成。

**请求URL**：`/api/v1/generate/extend`

**请求方法**：POST

**积分消耗**：17积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| defaultParamFlag | boolean | 否 | 是否使用自定义参数，默认为false |
| audioId | string | 是 | 要扩展的音频ID |
| prompt | string | 当defaultParamFlag=true时必需 | 扩展提示词，长度限制：3000字符 |
| style | string | 当defaultParamFlag=true时必需 | 音乐风格，长度限制：200字符 |
| title | string | 当defaultParamFlag=true时必需 | 音乐标题，长度限制：80字符 |
| continueAt | number | 否 | 从哪个位置开始扩展（秒） |
| model | string | 否 | 模型版本，可选值：V3_5、V4，必须与源音频的模型保持一致 |
| negativeTags | string | 否 | 负面标签 |
| callBackUrl | string | 否 | 回调URL |

**参数详情说明**：
* 当defaultParamFlag=true（自定义参数模式）时：
  * 需要提供prompt、style、title
  * prompt长度限制：3000字符
  * style长度限制：200字符
  * title长度限制：80字符
* 当defaultParamFlag=false（使用默认参数模式）时：
  * 仅需提供audioId
  * 其他参数将使用原音频的参数

**请求示例**：
```json
{
  "defaultParamFlag": true,
  "audioId": "5c79****be8e",
  "prompt": "Extend the music with more relaxing notes",
  "style": "Classical",
  "title": "Peaceful Piano Extended",
  "continueAt": 0,
  "model": "V3_5",
  "negativeTags": "Relaxing Piano",
  "callBackUrl": "https://api.example.com/callback"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5f7c0a54e2a971d9459ad02065c5b366"
  }
}
```

**回调数据示例**：
```json
{
  "code": 200,
  "msg": "All generated successfully.",
  "data": {
    "callbackType": "complete",
    "task_id": "2fac****9f72",
    "data": [
      {
        "id": "8551****662c",
        "audio_url": "https://example.cn/****.mp3",
        "source_audio_url": "https://example.cn/****.mp3",
        "stream_audio_url": "https://example.cn/****",
        "source_stream_audio_url": "https://example.cn/****",
        "image_url": "https://example.cn/****.jpeg",
        "source_image_url": "https://example.cn/****.jpeg",
        "prompt": "[Verse] 夜晚城市 灯火辉煌",
        "model_name": "chirp-v3-5",
        "title": "钢铁侠",
        "tags": "electrifying, rock",
        "createTime": "2025-01-01 00:00:00",
        "duration": 198.44
      }
    ]
  }
}
```

**注意事项**：
1. 生成的文件将保留15天
2. 扩展音乐的模型版本必须与源音频保持一致
3. 回调过程与音频生成接口相同
4. 当defaultParamFlag=false时，将使用原音频的参数
5. 回调格式与音频生成接口类似

## 歌词生成

### 创建歌词生成任务

创建一个新的音频歌词生成任务，可以根据提示词生成歌词内容。

**请求URL**：`/api/v1/lyrics`

**请求方法**：POST

**积分消耗**：0.4积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| prompt | string | 是 | 歌词生成提示词 |
| callBackUrl | string | 否 | 回调URL |

**请求示例**：
```json
{
  "prompt": "A song about peaceful night in the city",
  "callBackUrl": "https://api.example.com/callback"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "c5102b432328ec3bd08e9bea3641aa56"
  }
}
```

**回调数据示例**：
```json
{
  "code": 200,
  "msg": "All generated successfully.",
  "data": {
    "callbackType": "complete",
    "taskId": "11dc****8b0f",
    "lyricsData": [
      {
        "text": "[Verse]\n我穿越城市黑暗夜\n心中燃烧梦想的烈火",
        "title": "钢铁侠",
        "status": "complete",
        "errorMessage": ""
      },
      {
        "text": "[Verse]\n风在呼唤我名字\n钢铁盔甲闪得刺眼",
        "title": "钢铁侠",
        "status": "complete",
        "errorMessage": ""
      }
    ]
  }
}
```

**注意事项**：
1. 生成的歌词将保留15天
2. 回调只有一个阶段：complete（生成完成）
3. 每次生成会返回多个歌词版本供选择

### 查询歌词生成任务详情

根据任务ID查询歌词生成任务的详细信息，包括生成状态、参数和结果等。

**请求URL**：`/api/v1/lyrics/record-info`

**请求方法**：GET

**积分消耗**：0积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 任务ID |

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "11dc****8b0f",
    "param": "{\"prompt\":\"A song about peaceful night in the city\"}",
    "response": {
      "taskId": "11dc****8b0f",
      "lyricsData": [
        {
          "text": "[Verse]\n我穿越城市黑暗夜\n心中燃烧梦想的烈火",
          "title": "钢铁侠",
          "status": "complete",
          "errorMessage": ""
        }
      ]
    },
    "status": "SUCCESS",
    "type": "LYRICS",
    "errorCode": null,
    "errorMessage": null
  }
}
```

**状态说明**：
- PENDING: 待执行
- SUCCESS: 生成成功
- CREATE_TASK_FAILED: 创建任务失败
- GENERATE_LYRICS_FAILED: 生成歌词失败
- CALLBACK_EXCEPTION: 回调异常
- SENSITIVE_WORD_ERROR: 敏感词报错

## 带时间戳歌词

### 获取带时间戳的歌词字幕

获取音频的带时间戳歌词字幕，可用于制作同步字幕或可视化显示。

**请求URL**：`/api/v1/generate/get-timestamped-lyrics`

**请求方法**：POST

**积分消耗**：0.5积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 音频任务ID |
| audioId | string | 否 | 音频ID |
| musicIndex | number | 否 | 音频索引 |

**参数匹配逻辑**：
- 只传audioId：按audioId匹配
- 只传musicIndex：按索引匹配
- 两者都传：优先按audioId匹配，未找到则按索引匹配

**请求示例**：
```json
{
  "taskId": "5c79****be8e",
  "audioId": "5c79****be8e",
  "musicIndex": 0
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "alignedWords": [
      {
        "word": "[Verse]\nWaggin'",
        "success": true,
        "start_s": 1.36,
        "end_s": 1.79,
        "p_align": 0
      }
    ],
    "waveformData": [0, 1, 0.5, 0.75],
    "hootCer": 0.3803191489361702,
    "isStreamed": false
  }
}
```

**注意事项**：
1. 返回的时间戳单位为秒
2. 返回的波形数据可用于音频可视化展示
3. 当原始歌曲生成时使用了 `instrumental=true`（纯音乐模式），则不会有任何歌词返回

## WAV格式转换

### 创建WAV格式音频生成任务

基于已有的音频创建WAV格式音频生成任务，转换为更高质量的WAV格式。

**请求URL**：`/api/v1/wav/generate`

**请求方法**：POST

**积分消耗**：0.4积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 否 | 音频任务ID |
| audioId | string | 否 | 音频ID |
| callBackUrl | string | 否 | 回调URL |

**参数详情说明**：
* 需要提供taskId或audioId其中之一

**请求示例**：
```json
{
  "taskId": "5c79****be8e",
  "audioId": "5c79****be8e",
  "callBackUrl": "https://api.example.com/callback"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5c79****be8e"
  }
}
```

**回调数据示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "audio_wav_url": "https://example.com/s/04e6****e727.wav",
    "task_id": "988e****c8d3"
  }
}
```

**注意事项**：
1. 生成的WAV文件将保留15天
2. 回调只有一个阶段：complete（生成完成）
3. WAV格式通常比MP3格式占用更大的存储空间，但音质更好

### 查询WAV格式音频生成任务详情

根据任务ID查询WAV格式音频生成任务的详细信息，包括生成状态、参数和结果等。

**请求URL**：`/api/v1/wav/record-info`

**请求方法**：GET

**积分消耗**：0积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 任务ID |

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "988e****c8d3",
    "musicId": "8551****662c",
    "callbackUrl": "https://api.example.com/callback",
    "completeTime": "2025-01-01 00:10:00",
    "response": {
      "audio_wav_url": "https://example.com/s/04e6****e727.wav"
    },
    "status": "SUCCESS",
    "createTime": "2025-01-01 00:00:00",
    "errorCode": null,
    "errorMessage": null
  }
}
```

**状态说明**：
- PENDING: 待执行
- SUCCESS: 生成成功
- CREATE_TASK_FAILED: 创建任务失败
- GENERATE_WAV_FAILED: 生成WAV失败
- CALLBACK_EXCEPTION: 回调异常

## 人声分离

### 创建人声分离生成任务

基于已有的音频创建人声分离生成任务，可以将原始音频分离为人声和伴奏两个部分。

**请求URL**：`/api/v1/vocal-removal/generate`

**请求方法**：POST

**积分消耗**：4积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 音频任务ID |
| audioId | string | 是 | 音频ID |
| callBackUrl | string | 否 | 回调URL |

**参数详情说明**：
* 需要同时提供taskId和audioId

**请求示例**：
```json
{
  "taskId": "5c79****be8e",
  "audioId": "5c79****be8e",
  "callBackUrl": "https://api.example.com/callback"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5c79****be8e"
  }
}
```

**回调数据示例**：
```json
{
  "code": 200,
  "msg": "vocal Removal generated successfully.",
  "data": {
    "task_id": "5e72d367bdfbe44785e28d72cb1697c7",
    "vocal_removal_info": {
      "instrumental_url": "https://tempfile.aiquickdraw.com/v/94322944-2c96-4be3-b7fb-606e3924a8d2_instrumental.mp3",
      "origin_url": "https://cdn1.suno.ai/549fc4b2-294f-44ea-a35b-419687b07ab9.mp3",
      "vocal_url": "https://tempfile.aiquickdraw.com/v/94322944-2c96-4be3-b7fb-606e3924a8d2_vocal.mp3"
    }
  }
}
```

**注意事项**：
1. 生成的文件将保留15天
2. 回调只有一个阶段：complete（生成完成）
3. 回调会返回三个URL：原始音频、人声部分和伴奏部分

### 查询人声分离生成任务详情

根据任务ID查询人声分离生成任务的详细信息，包括生成状态、参数和结果等。

**请求URL**：`/api/v1/vocal-removal/record-info`

**请求方法**：GET

**积分消耗**：0积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 任务ID |

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5e72****97c7",
    "musicId": "8551****662c",
    "callbackUrl": "https://api.example.com/callback",
    "musicIndex": 0,
    "completeTime": "2025-01-01 00:10:00",
    "response": {
      "originUrl": "https://cdn1.suno.ai/****.mp3",
      "instrumentalUrl": "https://tempfile.aiquickdraw.com/****.mp3",
      "vocalUrl": "https://tempfile.aiquickdraw.com/****.mp3"
    },
    "successFlag": "SUCCESS",
    "createTime": "2025-01-01 00:00:00",
    "errorCode": null,
    "errorMessage": null
  }
}
```

**状态说明**：
- PENDING: 待执行
- SUCCESS: 生成成功
- CREATE_TASK_FAILED: 创建任务失败
- GENERATE_AUDIO_FAILED: 生成vocal removal失败
- CALLBACK_EXCEPTION: 回调异常

## MP4视频生成

### 创建MP4视频生成任务

基于已有的音频创建MP4视频生成任务，可以将音频转换为带可视化效果的MP4视频文件。

**请求URL**：`/api/v1/mp4/generate`

**请求方法**：POST

**积分消耗**：5积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 音频任务ID |
| audioId | string | 是 | 音频ID |
| callBackUrl | string | 否 | 回调URL |

**参数详情说明**：
* 需要同时提供taskId和audioId

**请求示例**：
```json
{
  "taskId": "taskId_774b9aa0422f",
  "audioId": "audioId_0295980ec02e",
  "callBackUrl": "https://api.example.com/callback"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "taskId_774b9aa0422f"
  }
}
```

**回调数据示例**：
```json
{
  "code": 200,
  "msg": "MP4 generated successfully.",
  "data": {
    "task_id": "taskId_774b9aa0422f",
    "video_url": "https://example.com/videos/video_847715e66259.mp4"
  }
}
```

**注意事项**：
1. 生成的视频文件将保留15天
2. 回调只有一个阶段：complete（生成完成）
3. 回调会返回视频文件的URL
4. 必须同时提供taskId和audioId

### 查询MP4视频生成任务详情

根据任务ID查询MP4视频生成任务的详细信息，包括生成状态、参数和结果等。

**请求URL**：`/api/v1/mp4/record-info`

**请求方法**：GET

**积分消耗**：0积分/次

**请求参数**：

| 参数名 | 类型 | 是否必需 | 说明 |
| ------ | ---- | -------- | ---- |
| taskId | string | 是 | 任务ID |

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "taskId_774b9aa0422f",
    "musicId": "audioId_0295980ec02e",
    "callbackUrl": "https://api.example.com/callback",
    "musicIndex": 0,
    "completeTime": "2025-01-01 00:10:00",
    "response": {
      "videoUrl": "https://example.com/videos/video_847715e66259.mp4"
    },
    "successFlag": "SUCCESS",
    "createTime": "2025-01-01 00:00:00",
    "errorCode": null,
    "errorMessage": null
  }
}
```

**状态说明**：
- PENDING: 待执行
- SUCCESS: 生成成功
- CREATE_TASK_FAILED: 创建任务失败
- GENERATE_MP4_FAILED: 生成MP4失败
- CALLBACK_EXCEPTION: 回调异常

## 查询剩余积分

查询当前账户剩余的积分数量。

**请求URL**：`/api/v1/generate/credit`

**请求方法**：GET

**积分消耗**：0积分/次

**响应示例**：
```json
{
  "code": 200,
  "msg": "success",
  "data": 100
}
```

**注意事项**：
1. 积分是使用API的基础，不同的操作消耗不同的积分
2. 积分不足时，将无法继续使用生成服务，返回429

## 回调处理与任务状态

### 回调机制概述

Suno API使用异步回调机制通知任务完成状态：

1. **回调触发时机**：
   - 任务进入不同阶段时（如文本生成、音频生成）
   - 任务完成时
   - 任务出错时

2. **回调类型**：
   - text：生成中文本（仅音乐生成）
   - first：首次结果（仅音乐生成）
   - complete：完成（所有类型）

3. **回调数据结构**：
   - 所有回调都包含code、msg和data字段
   - data中包含特定任务类型的详细信息

### 任务状态流转

任务状态通常按以下流程变化：

1. **音频生成**：PENDING → TEXT_SUCCESS → FIRST_SUCCESS → SUCCESS
2. **其他任务**：PENDING → SUCCESS

出错时可能出现以下状态：
- CREATE_TASK_FAILED：创建任务失败
- GENERATE_AUDIO_FAILED：生成失败
- CALLBACK_EXCEPTION：回调异常
- SENSITIVE_WORD_ERROR：敏感词报错

### 任务状态字段差异

不同API的任务状态可能使用不同的字段名称：
- 大多数API使用`status`字段
- 人声分离和MP4视频API可能使用`successFlag`字段

## 错误处理与故障排除

### 常见错误处理

1. **参数错误（400）**：
   - 检查必填参数是否都提供
   - 确认参数格式和类型是否正确

2. **认证错误（401）**：
   - 确认token是否正确提供
   - 验证token是否过期

3. **积分不足（429）**：
   - 查询剩余积分
   - 根据需要购买更多积分

4. **生成失败**：
   - 检查prompt是否包含敏感词
   - 确认音频ID是否存在
   - 尝试使用其他参数组合

### 本地开发注意事项

在本地开发环境中处理回调的建议：

1. **使用代理工具**：
   - 使用ngrok或localtunnel等工具创建临时公网URL
   - 将工具提供的URL设置为callBackUrl

2. **轮询状态**：
   - 不依赖回调，而是定期查询任务状态
   - 实现前端轮询机制获取最新状态

3. **记录详细日志**：
   - 记录每个请求的完整参数和响应
   - 保存回调数据以便分析

### 生产环境最佳实践

1. **组合使用回调和查询**：
   - 主要依靠回调机制处理状态更新
   - 使用任务查询作为备用机制

2. **实现重试机制**：
   - 对回调请求失败进行重试
   - 对长时间未完成的任务主动查询状态

3. **数据持久化**：
   - 将API返回的音频、视频URL保存到数据库
   - 及时下载重要文件，避免15天后过期

### 积分消耗一览表

| 接口功能 | 接口路径 | 积分消耗(每次) |
| ------ | -------- | ------------ |
| 创建音频生成任务 | `/api/v1/generate` | 20 |
| 创建音频扩展任务 | `/api/v1/generate/extend` | 17 |
| 获取带时间戳歌词 | `/api/v1/generate/get-timestamped-lyrics` | 0.5 |
| 创建歌词生成任务 | `/api/v1/lyrics` | 0.4 |
| 创建WAV音频任务 | `/api/v1/wav/generate` | 0.4 |
| 创建人声分离任务 | `/api/v1/vocal-removal/generate` | 4 |
| 创建MP4视频任务 | `/api/v1/mp4/generate` | 5 |
| 查询类接口 | 所有record-info及credit接口 | 0 |

## 常见问题解答

### 关于API调用

**问题**: 如何确保回调能够正确接收？  
**答案**: 在生产环境中，确保回调URL可以从公网访问；在开发环境中，可使用ngrok等工具创建临时公网URL，或使用轮询方式查询任务状态。

**问题**: 为什么我的请求返回401错误？  
**答案**: 这通常是由于认证问题引起的。检查您的Token是否正确，是否已过期，以及是否正确放置在请求头中（格式为`Authorization: Bearer <token>`）。

**问题**: 如何优化积分使用？  
**答案**: 
- 优先使用查询接口（不消耗积分）而非重新生成
- 对于音频扩展，可以适当设置continueAt参数来减少生成量
- 先使用歌词生成（0.4积分）后再进行音乐生成，以获得更精确的结果

### 关于生成内容

**问题**: 生成的音频多久过期？  
**答案**: 所有生成的内容（音频、视频、歌词等）将在15天后过期。请确保及时下载重要内容。

**问题**: 如何处理敏感词问题？  
**答案**: 
- 避免在提示词中使用政治、色情、暴力等敏感内容
- 使用negativeTags参数排除不需要的元素
- 如遇SENSITIVE_WORD_ERROR状态，尝试修改提示词后重新提交

**问题**: 如何获得最佳音频质量？  
**答案**: 针对重要音频，建议使用WAV格式转换功能（仅消耗0.4积分）获取更高质量的音频文件。

### 关于视频生成

**问题**: 如何创建MP4视频？  
**答案**: 使用MP4视频生成API时，只需提供音频的taskId和audioId两个必要参数，系统会自动生成视频并通过回调返回视频URL。

**问题**: MP4视频生成需要注意什么？  
**答案**: 
- 确保提供正确的taskId和audioId参数
- 视频生成完成后会通过回调通知，生成的视频将保留15天
- 如需长期保存视频，请及时下载
- 每次生成视频消耗5积分 